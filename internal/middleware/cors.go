package middleware

import (
  "time"
  "github.com/gin-contrib/cors"
  "github.com/gin-gonic/gin"
)

func NewCors(origins []string) gin.HandlerFunc {
  return cors.New(cors.Config{
    AllowOrigins:     origins,
    AllowMethods:     []string{"GET", "POST", "PUT"},
    AllowHeaders:     []string{"Origin", "Content-Type"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
    MaxAge: 12 * time.Hour,
  })
}
