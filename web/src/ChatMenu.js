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
import {Button, Input, Menu, Modal, Select} from "antd";
import {DeleteOutlined, LayoutOutlined, PlusOutlined} from "@ant-design/icons";

class ChatMenu extends React.Component {
  constructor(props) {
    super(props);

    const items = this.chatsToItems(this.props.chats);
    const openKeys = items.map((item) => item.key);
    this.state = {
      openKeys: openKeys,
      selectedKeys: ["0-0"],
      isModalOpen: false,
      inputUserName: "",
      inputChatType: "User",
      showUserNameInput: true,
    };
  }

  chatsToItems(chats) {
    const categories = {};
    chats.forEach((chat) => {
      if (!categories[chat.category]) {
        categories[chat.category] = [];
      }
      categories[chat.category].push(chat);
      if (this.props.account.name === chat.user1) {
        chat.displayName = chat.user2;
      } else {
        chat.displayName = chat.user1;
      }
    });

    const selectedKeys = this.state === undefined ? [] : this.state.selectedKeys;
    return Object.keys(categories).map((category, index) => {
      return {
        key: `${index}`,
        icon: <LayoutOutlined />,
        label: category,
        children: categories[category].map((chat, chatIndex) => {
          const globalChatIndex = chats.indexOf(chat);
          const isSelected = selectedKeys.includes(`${index}-${chatIndex}`);
          return {
            key: `${index}-${chatIndex}`,
            index: globalChatIndex,
            label: (
              <div
                className="menu-item-container"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {chat.displayName}
                {isSelected && (
                  <DeleteOutlined
                    className="menu-item-delete-icon"
                    style={{
                      visibility: "visible",
                      color: "inherit",
                      transition: "color 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "rgba(89,54,213,0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "inherit";
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.color = "rgba(89,54,213,0.4)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.color = "rgba(89,54,213,0.6)";
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (this.props.onDeleteChat) {
                        this.props.onDeleteChat(globalChatIndex);
                      }
                    }}
                  />
                )}
              </div>
            ),
          };
        }),
      };
    });
  }

  showModal = () => {
    this.setState({isModalOpen: true});
  };

  handleOk = () => {
    this.setState({isModalOpen: false});
    this.props.onAddChat(this.state.inputUserName, this.state.inputChatType);
  };

  handleCancel = () => {
    this.setState({isModalOpen: false});
  };

  onSelect = (info) => {
    const [categoryIndex, chatIndex] = info.selectedKeys[0].split("-").map(Number);
    const selectedItem = this.chatsToItems(this.props.chats)[categoryIndex].children[chatIndex];
    this.setState({
      selectedKeys: [`${categoryIndex}-${chatIndex}`],
    });

    if (this.props.onSelectChat) {
      this.props.onSelectChat(selectedItem.index);
    }
  };

  getRootSubmenuKeys(items) {
    return items.map((item, index) => `${index}`);
  }

  setSelectedKeyToNewChat(chats) {
    const items = this.chatsToItems(chats);
    const openKeys = items.map((item) => item.key);

    this.setState({
      openKeys: openKeys,
      selectedKeys: ["0-0"],
    });
  }

  onOpenChange = (keys) => {
    const items = this.chatsToItems(this.props.chats);
    const rootSubmenuKeys = this.getRootSubmenuKeys(items);
    const latestOpenKey = keys.find((key) => this.state.openKeys.indexOf(key) === -1);

    if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
      this.setState({openKeys: keys});
    } else {
      this.setState({openKeys: latestOpenKey ? [latestOpenKey] : []});
    }
  };

  handleUserChange = (e) => {
    this.setState({inputUserName: e.target.value});
  };

  handleChatTypeChange = (e) => {
    this.setState({inputChatType: e});
    if (e === "AI") {
      this.setState({showUserNameInput: false});
    } else {
      this.setState({showUserNameInput: true});
    }
  };

  render() {
    const items = this.chatsToItems(this.props.chats);

    return (
      <div>
        <Button
          icon={<PlusOutlined />}
          style={{
            width: "calc(100% - 8px)",
            height: "40px",
            margin: "4px",
            borderColor: "rgb(229,229,229)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(89,54,213,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.borderColor = "rgba(89,54,213,0.4)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.borderColor = "rgba(89,54,213,0.6)";
          }}
          onClick={this.showModal}
        >
          New Chat
        </Button>
        <Modal title="add chat" open={this.state.isModalOpen} onOk={this.handleOk} onCancel={this.handleCancel}>
          <p>
            chat type <Select
              defaultValue="User"
              onChange={this.handleChatTypeChange}
              options={[
                {value: "AI", label: "AI"},
                {value: "User", label: "User"},
              ]}
            />
          </p>
          {this.state.showUserNameInput && <p><Input placeholder="user name" onChange={this.handleUserChange}></Input></p>}
        </Modal>
        <Menu
          style={{maxHeight: "calc(100vh - 140px - 40px - 8px)", overflowY: "auto"}}
          mode="inline"
          openKeys={this.state.openKeys}
          selectedKeys={this.state.selectedKeys}
          onOpenChange={this.onOpenChange}
          onSelect={this.onSelect}
          items={items}
        />
      </div>
    );
  }
}

export default ChatMenu;
