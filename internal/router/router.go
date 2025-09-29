package router

import (
	"t-cubed/internal/handler"

	"github.com/gin-gonic/gin"
)

type Router struct {
	engine *gin.Engine
	gameHandler *handler.GameHandler
}

func NewRouter(engine *gin.Engine, gameHandler *handler.GameHandler) *Router {
	router := &Router{
		engine,
		gameHandler,
	}
	return router	
}
