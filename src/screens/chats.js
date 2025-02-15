const blessed = require('neo-blessed');
const State = require('../lib/state');
const Chat = require('../lib/model/chat');
const EE = require('../lib/eventemitter');
const format = require('../lib/format');
const working = require('./working');
const confirm = require('./confirm');
const {
  COLORS_ACTIVE_ITEM,
  COLORS_ACTIVE_SELECTED,
  COLORS_INACTIVE_ITEM,
  COLORS_INACTIVE_SELECTED,
} = require('../../constants');

const chats = blessed.list({
  label: 'Rooms',
  width: '25%',
  height: '100%',
  tags: true,
  border: {
    type: 'line',
  },
  style: {
    item: COLORS_ACTIVE_ITEM,
    selected: COLORS_ACTIVE_SELECTED,
  },
  items: [format.placehold()],
});
chats._data = {
  visible: [],
};
chats.chat = function () {
  return chats._data.visible[chats.selected];
};

/**
 * Keybindings
 */
chats.key('/', () => EE.emit('search.local'));
chats.key('f', () => EE.emit('search.remote'));
chats.key('C-r l', () => leave(chats.chat()));
// chats.key('e', toggleExpand);
chats.key(['j', 'down'], () => {
  chats.down();
  chats.screen.render();
});
chats.key(['k', 'up'], () => {
  chats.up();
  chats.screen.render();
});
chats.key(['g'], () => {
  chats.select(0);
  chats.screen.render();
});
chats.key(['S-g'], () => {
  chats.select(chats._data.visible.length - 1);
  chats.screen.render();
});
chats.key('enter', () => {
  EE.emit('chats.select', chats.chat());
});

chats.on('focus', () => {
  chats.style.item = COLORS_ACTIVE_ITEM;
  chats.style.selected = COLORS_ACTIVE_SELECTED;
  chats.screen.render();
});
chats.on('blur', () => {
  chats.style.item = COLORS_INACTIVE_ITEM;
  chats.style.selected = COLORS_INACTIVE_SELECTED;
  chats.screen.render();
});

/**
 * External events
 */
EE.on('chats.update', display);
EE.on('chats.activate', () => {
  chats.focus();
  chats.screen.render();
});

async function display() {
  // Object.keys(chats._data.config).forEach(type => {
  //   // ugh
  //   const displayable = allChats.filter(chat => chatType(chat) === type);

  //   if (chats._data.config[type].expanded) {
  //     content.push(`{underline}▲ Collapse ${type}{/}`);
  //     visible.push({ collapse: true, title: true });
  //   } else {
  //     if (displayable.length > chats._data.config[type].collapsedMax) {
  //       content.push(`{underline}▼ Expand ${type}{/}`);
  //       visible.push({ expand: true, title: true });
  //     } else {
  //       content.push(`{underline}${type}{/}`);
  //       visible.push({ title: true });
  //     }
  //   }

  //   const toDisplay = displayable.slice(
  //     0,
  //     chats._data.config[type].collapsedMax
  //   );
  //   content = content.concat(toDisplay.map(format.chat));
  //   visible = visible.concat(toDisplay);
  // });

  chats._data.visible = State.chats();
  chats.setItems(chats._data.visible.map(format.chat));
  chats.screen.render();
}

function leave(chat) {
  return confirm.ask(`Leave ${chat.displayName}?`).then(async ans => {
    if (ans) {
      working.show();
      const sel = chats.selected;
      await Chat.leave(chat);
      const type = typeOf(chat);
      chats._data.chats[type] = chats._data.chats[type].filter(
        c => c.uri !== chat.uri
      );

      display();
      chats.select(sel);
      working.hide();
    }
  });
}

module.exports = {
  chats,
};
