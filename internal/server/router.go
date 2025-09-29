package server

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type Router struct {
	engine *gin.Engine
	dbConn *pgx.Conn
}

func NewRouter(engine *gin.Engine, dbConn *pgx.Conn) *Router {
	router := &Router{
		engine,
		dbConn,
	}
	return router	
}
