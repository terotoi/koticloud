package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/proc"
)

// LocalUploadRequest requests an upload of a file accessible
// by the server itself.
type LocalUploadRequest struct {
	ParentID    int // ID of the target directory
	Filename    string
	LocalPath   string // Path from where to read the file
	SymlinkData bool
}

// Processes data from multipart upload. Returns the path to the uploaded file.
func dataFromMultipart(r *http.Request, uploadDir string) (string, error) {
	fh, _, err := r.FormFile("file")
	if err != nil {
		return "", err
	}
	defer fh.Close()

	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		err := os.MkdirAll(uploadDir, 0770)
		if err != nil {
			return "", err
		}
	}

	tfh, err := ioutil.TempFile(uploadDir, "upload-*")
	if err != nil {
		return "", err
	}
	uploadFile := tfh.Name()

	// Remove the uploaded file, unless it is passed to the node proc
	removeUploadFile := true
	defer func() {
		if tfh != nil {
			tfh.Close()
		}
		if removeUploadFile {
			os.Remove(uploadFile)
		}
	}()

	_, err = io.Copy(tfh, fh)
	if err != nil {
		return "", err
	}

	tfh.Close()
	tfh = nil

	removeUploadFile = false
	return uploadFile, nil
}

// NodeNew creates a new file. Data is retrieved from multipart upload.
func NodeNew(uploadDir, fileRoot, thumbRoot string, procCh chan proc.NodeProcessRequest,
	db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		multiPart := strings.HasPrefix(r.Header.Get("Content-Type"), "multipart/form-data")
		var uploadFile string
		var filename string
		var removeUploadFile bool
		var symlinkData bool

		ctx := r.Context()
		tx, err := db.BeginTx(ctx, nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		var parentID int
		if multiPart {
			err := r.ParseMultipartForm(int64(32 << 20))
			if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
				return
			}

			parentID, err = strconv.Atoi(r.FormValue("parentID"))
			if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
				return
			}

			filename = r.FormValue("filename")
		} else {
			dec := json.NewDecoder(r.Body)
			var req LocalUploadRequest
			err := dec.Decode(&req)
			if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
				return
			}

			uploadFile = req.LocalPath
			parentID = req.ParentID
			filename = req.Filename
			symlinkData = req.SymlinkData
		}

		if filename == "" {
			report("missing filename", http.StatusBadRequest, r, w)
			return
		}

		parent, err := fs.NodeByID(ctx, parentID, tx)
		if reportInt(err, r, w) != nil {
			return
		}

		if !fs.AccessAllowed(user, parent, true) {
			reportUnauthorized("no access", r, w)
			return
		}

		// Early test for existing file. Avoids creating the temporary upload file.
		existing, err := fs.NodeChildByName(ctx, filename, parent.ID, tx)
		if err := reportInt(err, r, w); err != nil {
			return
		}

		if existing != nil {
			report(fmt.Sprintf("file already exists: %s", filename), http.StatusConflict, r, w)
			return
		}

		// Late processing of multipart data.
		if multiPart {
			uploadFile, err = dataFromMultipart(r, uploadDir)
			if reportInt(err, r, w) != nil {
				return
			}
			removeUploadFile = true
		}

		defer func() {
			if removeUploadFile {
				os.Remove(uploadFile)
			}
		}()

		mimeType, err := fs.DetectMimeType(uploadFile)
		if reportInt(err, r, w) != nil {
			return
		}

		st, err := os.Stat(uploadFile)
		if reportInt(err, r, w) != nil {
			return
		}

		node, err := fs.NewFile(ctx, parent, filename, mimeType, st.Size(),
			user, nil, false, tx)
		if err != nil {
			reportSystemError(err, r, w)
			return
		}

		if err = fs.CopyData(node, uploadFile, symlinkData, fileRoot); err != nil {
			reportSystemError(err, r, w)
			return
		}

		log.Printf("new: %s -> %s [%s] (%s, %d bytes)", uploadFile, filename,
			fs.NodeLocalPath(fileRoot, node.ID, true), node.MimeType, st.Size())

		err = tx.Commit()
		if reportInt(err, r, w) != nil {
			return
		}

		if err := proc.AddNodeProcessRequest(ctx, procCh, node, uploadFile, removeUploadFile, db); err != nil {
			reportIf(err, http.StatusInternalServerError, "failed to process upload", r, w)
		}

		// NodeProcessor will remove the upload file, if needed.
		removeUploadFile = false
		respJSON([]*models.Node{node}, r, w)
	}
}

// NodeUpdate updates an existing node. Data is retrieved from multipart upload.
func NodeUpdate(uploadDir, fileRoot, thumbRoot string, procCh chan proc.NodeProcessRequest,
	db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		err := r.ParseMultipartForm(int64(32 << 20))
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		ctx := r.Context()
		tx, err := db.BeginTx(ctx, nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		nodeID, err := strconv.Atoi(r.FormValue("nodeID"))
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		node, err := fs.NodeByID(ctx, nodeID, tx)
		if reportInt(err, r, w) != nil {
			return
		}

		if !fs.AccessAllowed(user, node, true) {
			reportUnauthorized("no access", r, w)
			return
		}

		uploadFile, err := dataFromMultipart(r, uploadDir)
		if reportInt(err, r, w) != nil {
			return
		}

		removeUploadFile := true
		defer func() {
			if removeUploadFile {
				os.Remove(uploadFile)
			}
		}()

		mimeType, err := fs.DetectMimeType(uploadFile)
		if reportInt(err, r, w) != nil {
			return
		}

		st, err := os.Stat(uploadFile)
		if reportInt(err, r, w) != nil {
			return
		}

		if err := fs.UpdateFile(ctx, node, mimeType, st.Size(), user, nil, false, tx); err != nil {
			reportSystemError(err, r, w)
			return
		}

		if err := os.Remove(fs.NodeLocalPath(fileRoot, node.ID, true)); err != nil {
			log.Println(err)
		}

		if err = fs.CopyData(node, uploadFile, false, fileRoot); err != nil {
			reportSystemError(err, r, w)
			return
		}

		log.Printf("update: %s -> %s (%s, %d bytes)", uploadFile,
			fs.NodeLocalPath(fileRoot, node.ID, true), node.MimeType, st.Size())

		err = tx.Commit()
		if reportInt(err, r, w) != nil {
			return
		}

		// NodeProcessor will remove the upload file
		if err := proc.AddNodeProcessRequest(ctx, procCh, node, uploadFile, true, db); err != nil {
			reportIf(err, http.StatusInternalServerError, "failed to process upload", r, w)
		}
		removeUploadFile = false
		respJSON([]*models.Node{node}, r, w)
	}
}
