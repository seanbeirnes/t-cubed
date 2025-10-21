package middleware

import (
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func NewStatic() gin.HandlerFunc {
	return static.Serve("/", static.LocalFile("./static", false))
}
