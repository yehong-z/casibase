package connect

import (
	"sync"

	"github.com/casbin/casibase/object"
)

var (
	once           = sync.Once{}
	messageService *MessageService
)

type Connect interface {
	SendMessage(message *object.Message)
	Connect(user string) (chan *object.Message, func(), error)
	Close(user string)
	listen()
}

type MessageService struct {
	message      chan *object.Message
	onlineClient map[string]chan *object.Message // key: casdoor.User.ID
}

func NewMessageService() *MessageService {
	once.Do(func() {
		messageService = &MessageService{
			message:      make(chan *object.Message, 1000),
			onlineClient: make(map[string]chan *object.Message),
		}

		go messageService.listen()
	})
	return messageService
}

func (m *MessageService) SendMessage(message *object.Message) {
	m.message <- message
}

func (m *MessageService) Connect(user string) (chan *object.Message, func(), error) {
	m.onlineClient[user] = make(chan *object.Message)
	return m.onlineClient[user], func() { m.Close(user) }, nil
}

func (m *MessageService) Close(user string) {
	delete(m.onlineClient, user)
}

func (m *MessageService) listen() {
	for {
		select {
		case msg := <-m.message:
			if _, ok := m.onlineClient[msg.ReplyTo]; ok {
				m.onlineClient[msg.ReplyTo] <- msg
			}
		}
	}
}
