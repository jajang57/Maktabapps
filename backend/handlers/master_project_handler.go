package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// generateProjectCode generates a new project code with format Pro/ddmmyy/xxx
func generateProjectCode(db *gorm.DB) (string, error) {
	fmt.Println("[DEBUG] generateProjectCode: Starting...")

	now := time.Now()
	datePart := now.Format("020106") // ddmmyy
	prefix := fmt.Sprintf("Pro/%s", datePart)

	fmt.Printf("[DEBUG] generateProjectCode: datePart=%s, prefix=%s\n", datePart, prefix)

	var lastProject models.MasterProject
	// Find the last project created in the current month
	year, month, _ := now.Date()
	startOfMonth := time.Date(year, month, 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

	fmt.Printf("[DEBUG] generateProjectCode: Searching projects between %v and %v\n", startOfMonth, endOfMonth)

	err := db.Where("created_at BETWEEN ? AND ?", startOfMonth, endOfMonth).
		Order("kode_project desc").
		First(&lastProject).Error

	seq := 1
	if err == nil {
		// Found a project in the same month, increment the sequence
		fmt.Printf("[DEBUG] generateProjectCode: Found last project: %+v\n", lastProject)

		// Extract sequence from kode_project (format: Pro/ddmmyy/xxx)
		parts := strings.Split(lastProject.KodeProject, "/")
		if len(parts) == 3 {
			if lastSeq, parseErr := strconv.Atoi(parts[2]); parseErr == nil {
				seq = lastSeq + 1
				fmt.Printf("[DEBUG] generateProjectCode: Last sequence: %d, new sequence: %d\n", lastSeq, seq)
			} else {
				fmt.Printf("[DEBUG] generateProjectCode: Error parsing sequence from %s: %v\n", parts[2], parseErr)
			}
		}
	} else if err != gorm.ErrRecordNotFound {
		// An actual error occurred
		fmt.Printf("[DEBUG] generateProjectCode: Database query error: %v\n", err)
		return "", err
	} else {
		fmt.Println("[DEBUG] generateProjectCode: No projects found for this month, starting with 001")
	}

	result := fmt.Sprintf("%s/%03d", prefix, seq)
	fmt.Printf("[DEBUG] generateProjectCode: Generated project code: %s\n", result)
	return result, nil
}

// CreateMasterProject handles the creation of a new project
func CreateMasterProject(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("[DEBUG] CreateMasterProject: Request received")

		var request struct {
			NamaProject string `json:"nama_project" binding:"required"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			fmt.Printf("[DEBUG] CreateMasterProject: Binding error: %v\n", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		fmt.Printf("[DEBUG] CreateMasterProject: Request data: %+v\n", request)

		// Generate project code
		kodeProject, err := generateProjectCode(db)
		if err != nil {
			fmt.Printf("[DEBUG] CreateMasterProject: generateProjectCode error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate project code: " + err.Error()})
			return
		}

		fmt.Printf("[DEBUG] CreateMasterProject: Generated code: %s\n", kodeProject)

		project := models.MasterProject{
			KodeProject: kodeProject,
			NamaProject: request.NamaProject,
		}

		fmt.Printf("[DEBUG] CreateMasterProject: Creating project: %+v\n", project)

		if err := db.Create(&project).Error; err != nil {
			fmt.Printf("[DEBUG] CreateMasterProject: Database create error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project: " + err.Error()})
			return
		}

		fmt.Printf("[DEBUG] CreateMasterProject: Project created successfully: %+v\n", project)

		c.JSON(http.StatusCreated, gin.H{
			"message": "Project created successfully",
			"data":    project,
		})
	}
}

// GetMasterProjects handles fetching all projects
func GetMasterProjects(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("[DEBUG] GetMasterProjects: Request received")

		var projects []models.MasterProject
		if err := db.Order("kode_project desc").Find(&projects).Error; err != nil {
			fmt.Printf("[DEBUG] GetMasterProjects: Database error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
			return
		}

		fmt.Printf("[DEBUG] GetMasterProjects: Found %d projects\n", len(projects))
		c.JSON(http.StatusOK, gin.H{"data": projects})
	}
}

// UpdateMasterProject handles updating a project
func UpdateMasterProject(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Printf("[DEBUG] UpdateMasterProject: Request received for ID: %s\n", c.Param("id"))

		var project models.MasterProject
		if err := db.Where("id = ?", c.Param("id")).First(&project).Error; err != nil {
			fmt.Printf("[DEBUG] UpdateMasterProject: Project not found: %v\n", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}

		var input struct {
			NamaProject string `json:"nama_project" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			fmt.Printf("[DEBUG] UpdateMasterProject: Binding error: %v\n", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		fmt.Printf("[DEBUG] UpdateMasterProject: Updating project: %+v\n", input)

		if err := db.Model(&project).Update("nama_project", input.NamaProject).Error; err != nil {
			fmt.Printf("[DEBUG] UpdateMasterProject: Database error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
			return
		}

		fmt.Printf("[DEBUG] UpdateMasterProject: Project updated successfully: %+v\n", project)
		c.JSON(http.StatusOK, gin.H{
			"message": "Project updated successfully",
			"data":    project,
		})
	}
}

// DeleteMasterProject handles deleting a project
func DeleteMasterProject(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Printf("[DEBUG] DeleteMasterProject: Request received for ID: %s\n", c.Param("id"))

		var project models.MasterProject
		if err := db.Where("id = ?", c.Param("id")).First(&project).Error; err != nil {
			fmt.Printf("[DEBUG] DeleteMasterProject: Project not found: %v\n", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}

		fmt.Printf("[DEBUG] DeleteMasterProject: Deleting project: %+v\n", project)

		if err := db.Delete(&project).Error; err != nil {
			fmt.Printf("[DEBUG] DeleteMasterProject: Database error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
			return
		}

		fmt.Printf("[DEBUG] DeleteMasterProject: Project deleted successfully\n")
		c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
	}
}
