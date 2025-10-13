package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/requestid"
)

func NewRequestID() gin.HandlerFunc {
	return requestid.New()
}
