package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/secure"
)

func NewSecure(isDevelopment bool) gin.HandlerFunc {
	return secure.New(secure.Config{
		SSLRedirect:           false, // for container deployment on PaaS, but should be true for server deployment
		IsDevelopment:         isDevelopment,
		STSSeconds:            15552000,
		STSIncludeSubdomains:  true,
		FrameDeny:             true,
		ContentTypeNosniff:    true,
		BrowserXssFilter:      true,
		ContentSecurityPolicy: "default-src 'self'",
		IENoOpen:              true,
		ReferrerPolicy:        "strict-origin-when-cross-origin",
		SSLProxyHeaders:       map[string]string{"X-Forwarded-Proto": "https"},
	})
}
