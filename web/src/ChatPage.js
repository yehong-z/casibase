// Copyright 2023 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import {Spin} from "antd";
import moment from "moment";
import ChatMenu from "./ChatMenu";
import ChatBox from "./ChatBox";
import * as Setting from "./Setting";
import * as ChatBackend from "./backend/ChatBackend";
import * as MessageBackend from "./backend/MessageBackend";
import i18next from "i18next";
import BaseListPage from "./BaseListPage";

class ChatPage extends BaseListPage {
  constructor(props) {
    super(props);

    this.menu = React.createRef();
  }

  UNSAFE_componentWillMount() {
    this.setState({
      loading: true,
    });

    this.fetch();
  }

  newChat(userName, chatType) {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin", // this.props.account.applicationName,
      name: `chat_${randomName}`,
      createdTime: moment().format(),
      updatedTime: moment().format(),
      // organization: this.props.account.owner,
      displayName: `chat_${randomName}`,
      type: chatType,
      category: "Chat Category - 1",
      user1: `${this.props.account.name}`,
      user2: `${userName}`,
      users: [`${this.props.account.name}`],
      messageCount: 0,
    };
  }

  newMessage(text) {
    const randomName = Setting.getRandomName();
    return {
      owner: "admin", // this.props.account.messagename,
      name: `message_${randomName}`,
      createdTime: moment().format(),
      // organization: this.props.account.owner,
      chat: this.state.chatName,
      replyTo: "",
      author: `${this.props.account.name}`,
      text: text,
    };
  }

  sendMessage(text) {
    const newMessage = this.newMessage(text);
    MessageBackend.addMessage(newMessage)
      .then((res) => {
        if (res.status === "ok") {
          this.getMessages(this.state.chatName);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  getMessages(chatName) {
    MessageBackend.getChatMessages(chatName)
      .then((res) => {
        this.setState({
          messages: res.data,
        });

        if (res.data.length > 0) {
          const lastMessage = res.data[res.data.length - 1];
          if (lastMessage.author === "AI" && lastMessage.replyTo !== "" && lastMessage.text === "") {
            let text = "";
            MessageBackend.getMessageAnswer(lastMessage.owner, lastMessage.name, (data) => {
              if (data === "") {
                data = "\n";
              }

              const lastMessage2 = Setting.deepCopy(lastMessage);
              text += data;
              lastMessage2.text = text;
              res.data[res.data.length - 1] = lastMessage2;
              this.setState({
                messages: res.data,
              });
            }, (error) => {
              Setting.showMessage("error", `${i18next.t("general:Failed to get answer")}: ${error}`);

              const lastMessage2 = Setting.deepCopy(lastMessage);
              lastMessage2.text = `#ERROR#: ${error}`;
              res.data[res.data.length - 1] = lastMessage2;
              this.setState({
                messages: res.data,
              });
            });
          }
        }

        Setting.scrollToDiv(`chatbox-list-item-${res.data.length}`);
      });
  }

  addChat(userName, chatType) {
    const newChat = this.newChat(userName, chatType);
    ChatBackend.addChat(newChat)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully added"));
          this.setState({
            chatName: newChat.name,
            messages: null,
          });
          this.getMessages(newChat.name);

          this.fetch({}, false);
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to add")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  deleteChat(chats, i, chat) {
    ChatBackend.deleteChat(chat)
      .then((res) => {
        if (res.status === "ok") {
          Setting.showMessage("success", i18next.t("general:Successfully deleted"));
          const data = Setting.deleteRow(this.state.data, i);
          const j = Math.min(i, data.length - 1);
          if (j < 0) {
            this.setState({
              chatName: undefined,
              messages: [],
              data: data,
            });
          } else {
            const focusedChat = data[j];
            this.setState({
              chatName: focusedChat.name,
              messages: null,
              data: data,
            });
            this.getMessages(focusedChat.name);
          }
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to delete")}: ${res.msg}`);
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
      });
  }

  getCurrentChat() {
    return this.state.data.filter(chat => chat.name === this.state.chatName)[0];
  }

  renderTable(chats) {
    const onSelectChat = (i) => {
      const chat = chats[i];
      this.setState({
        chatName: chat.name,
        messages: null,
      });
      this.getMessages(chat.name);
    };

    const onAddChat = (userName, chatType) => {
      this.addChat(userName, chatType);
    };

    const onDeleteChat = (i) => {
      const chat = chats[i];
      this.deleteChat(chats, i, chat);
    };

    if (this.state.loading) {
      return (
        <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
          <Spin size="large" tip={i18next.t("login:Loading")} style={{paddingTop: "10%"}} />
        </div>
      );
    }

    return (
      <div style={{display: "flex", height: "calc(100vh - 136px)"}}>
        <div style={{width: "250px", height: "100%", backgroundColor: "white", borderRight: "1px solid rgb(245,245,245)", borderBottom: "1px solid rgb(245,245,245)"}}>
          <ChatMenu ref={this.menu} chats={chats} onSelectChat={onSelectChat} onAddChat={onAddChat} onDeleteChat={onDeleteChat} account={this.props.account} />
        </div>
        <ChatBox messages={this.state.messages} sendMessage={(text) => {this.sendMessage(text);}} account={this.props.account} chatName={this.state.chatName} />
      </div>
    );
  }

  fetch = (params = {}, setLoading = true) => {
    let field = params.searchedColumn, value = params.searchText;
    const sortField = params.sortField, sortOrder = params.sortOrder;
    if (params.category !== undefined && params.category !== null) {
      field = "category";
      value = params.category;
    } else if (params.type !== undefined && params.type !== null) {
      field = "type";
      value = params.type;
    }
    if (setLoading) {
      this.setState({loading: true});
    }
    ChatBackend.getChats("admin", -1, field, value, sortField, sortOrder)
      .then((res) => {
        if (res.status === "ok") {
          this.setState({
            loading: false,
            data: res.data,
            messages: [],
            searchText: params.searchText,
            searchedColumn: params.searchedColumn,
          });

          const chats = res.data;
          if (this.state.chatName === undefined && chats.length > 0) {
            const chat = chats[0];
            this.getMessages(chat.name);
            this.setState({
              chatName: chat.name,
            });
          }

          if (!setLoading) {
            this.menu.current.setSelectedKeyToNewChat(chats);
          }
        }
      });

    MessageBackend.subscribeMessage("admin", this.props.account.name, (e) => {
      const msg = JSON.parse(e);
      if (msg.chat === this.getCurrentChat().name) {
        this.state.messages.push(msg);
        this.setState({});
      }
    });
  };
}

export default ChatPage;
