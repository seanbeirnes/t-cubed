package middleware

import (
	"time"
	"net"
	"sync"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

const (
	RATELIMIT_FREQ = time.Second
	RATELIMIT_BURST = 10
)

func NewRateLimiter() gin.HandlerFunc {
	var mu sync.Mutex
	freq := rate.Every(RATELIMIT_FREQ)
	burst := RATELIMIT_BURST

	// Map of ip addresses to rate limits
	limiters := make(map[string]*rate.Limiter)

	getLimiter := func(ip string) *rate.Limiter {
		mu.Lock()
		defer mu.Unlock()
		if limiter, ok := limiters[ip]; ok {
			return limiter
		}
		limiter := rate.NewLimiter(freq, burst)
		limiters[ip] = limiter
		return limiter
	}

	return func(c *gin.Context) {
		ip, _, _ := net.SplitHostPort(c.Request.RemoteAddr)
		limiter := getLimiter(ip)
		if !limiter.Allow() {
			c.AbortWithStatus(http.StatusTooManyRequests)
			return
		}
	}
}
