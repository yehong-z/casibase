package service

import "github.com/casbin/casibase/util"

const (
	chatWorker    = 1
	messageWorker = 2
)

type IDGenerator interface {
	GetId() (int64, error)
}

type ChatIdGenerator struct {
	IDGenerator
	snow *util.Snow
}

func NewChatIdGenerator() *ChatIdGenerator {
	return &ChatIdGenerator{snow: util.NewSnow(chatWorker)}
}

func (c *ChatIdGenerator) GetId() (int64, error) {
	return c.snow.GetSnowFlakeID()
}

type MessageIdGenerator struct {
	IDGenerator
	snow *util.Snow
}

func NewMessageIdGenerator() *MessageIdGenerator {
	return &MessageIdGenerator{snow: util.NewSnow(messageWorker)}
}

func (m *MessageIdGenerator) GetId() (int64, error) {
	return m.snow.GetSnowFlakeID()
}
