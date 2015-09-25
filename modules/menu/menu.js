C.registerModule("menu");

C.registerDbModel("menu");

C.registerDbSchema("menu", {
  "menulink": {
    "title": "Menu link",
    "description": "A link in the main menu",
    "type": [{
      "title": {
        "type": String,
        "required": true,
        "title": "Title",
        "description": "The title of the link in the menu"
      },
      "path": {
        "type": String,
        "required": true,
        "title": "Path",
        "description": "The menu path"
      },
      "children": {
        "title": "Menu item children",
        "description": "Children of the menu item (a sub menu)",
        "type": [{
          "title": {
            "type": String,
            "required": true,
            "title": "Title",
            "description": "The title of the menu item"
          },
          "path": {
            "type": String,
            "title": "Path",
            "description": "The path of the menu item"
          }
        }]
      }
    }]
  },
  "title": {
    "type": String,
    "required": true,
    "title": "Menu title",
    "description": "The title of the menu"
  }
});
