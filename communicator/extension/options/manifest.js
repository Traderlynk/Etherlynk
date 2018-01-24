this.manifest = {
    "name": "Communicator",
    "icon": "../tl_icon.png",
    "settings": [
        {
            "tab": i18n.get("general"),
            "group": i18n.get("connection"),
            "name": "server",
            "type": "text",
            "label": i18n.get("server"),
            "text": "server name:port"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("connection"),
            "name": "domain",
            "type": "text",
            "label": i18n.get("domain"),
            "text": "domain name"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("connection"),
            "name": "useWebsocket",
            "type": "checkbox",
            "label": i18n.get("Use Websockets")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "displayname",
            "type": "text",
            "label": i18n.get("displayname"),
            "text": i18n.get("x-characters")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "username",
            "type": "text",
            "label": i18n.get("username"),
            "text": i18n.get("x-characters")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "password",
            "type": "text",
            "label": i18n.get("password"),
            "text": i18n.get("x-characters-pw"),
            "masked": true
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "connect",
            "type": "button",
            "label": i18n.get("connect"),
            "text": i18n.get("login")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "status",
            "text": i18n.get(""),
            "type": "description"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "desktopShareMode",
            "type": "checkbox",
            "label": i18n.get("Desktop Share mode only")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "showOnlyOnlineUsers",
            "type": "checkbox",
            "label": i18n.get("Show Only Online Users")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "popupWindow",
            "type": "checkbox",
            "label": i18n.get("Popup Window")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "showSharedCursor",
            "type": "checkbox",
            "label": i18n.get("Show Shared Cursor")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "enableRingtone",
            "type": "checkbox",
            "label": i18n.get("Enable Ringtone")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "useJabra",
            "type": "checkbox",
            "label": i18n.get("Use Jabra Speakerphone (Models 410, 510, 710 & 810)")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "enableChat",
            "type": "checkbox",
            "label": i18n.get("Enable Candy Chat")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "enableSip",
            "type": "checkbox",
            "label": i18n.get("Enable SIP Phone")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "audioOnly",
            "type": "checkbox",
            "label": i18n.get("Audioconference Only")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "enableBlog",
            "type": "checkbox",
            "label": i18n.get("Enable Blogging")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "enableST",
            "type": "checkbox",
            "label": i18n.get("Enable ST")
        },
        {                                                   // ofmeet config
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "disableAudioLevels",
            "type": "checkbox",
            "label": i18n.get("Disable Audio levels")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "enableLipSync",
            "type": "checkbox",
            "label": i18n.get("Enable LipSync")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "startWithAudioMuted",
            "type": "checkbox",
            "label": i18n.get("Start with Audio Muted")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "startWithVideoMuted",
            "type": "checkbox",
            "label": i18n.get("Start with Video Muted")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "startBitrate",
            "type": "text",
            "label": i18n.get("Start Bitrate"),
            "text": i18n.get("800"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "resolution",
            "type": "text",
            "label": i18n.get("Resolution"),
            "text": i18n.get("720"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "minHDHeight",
            "type": "text",
            "label": i18n.get("Min HD Height"),
            "text": i18n.get("540"),
        },
        {                                               // ofmeet ui
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("ui"),
            "name": "VERTICAL_FILMSTRIP",
            "type": "checkbox",
            "label": i18n.get("Enable Vertical Filmstrip")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("ui"),
            "name": "ACTIVE_SPEAKER_AVATAR_SIZE",
            "type": "text",
            "label": i18n.get("Active Speaker Avatar Size"),
            "text": i18n.get("100"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("ui"),
            "name": "FILM_STRIP_MAX_HEIGHT",
            "type": "text",
            "label": i18n.get("Filmstrip Maximium Height"),
            "text": i18n.get("80"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Candy Chat"),
            "name": "chatWithOnlineContacts",
            "type": "checkbox",
            "label": i18n.get("Chat with Online Contacts")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Candy Chat"),
            "name": "notifyWhenMentioned",
            "type": "checkbox",
            "label": i18n.get("Notify/Highlight when mentioned")
        },
        {                                           // blogger
            "tab": i18n.get("Blogging"),
            "group": i18n.get("Blogger"),
            "name": "blogName",
            "type": "text",
            "label": i18n.get("Blog Name"),
            "text": i18n.get("solo"),
        },
        {                                           // soft turret
            "tab": i18n.get("ST Page:1"),
            "group": i18n.get("General"),
            "name": "pageLabel_1",
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page 1"),
        },
        {
            "tab": i18n.get("ST Page:2"),
            "group": i18n.get("General"),
            "name": "pageLabel_2",
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page 2"),
        },
        {
            "tab": i18n.get("ST Page:3"),
            "group": i18n.get("General"),
            "name": "pageLabel_3",
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page 3"),
        },
        {
            "tab": i18n.get("ST Page:4"),
            "group": i18n.get("General"),
            "name": "pageLabel_4",
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page 4"),
        },
        {
            "tab": i18n.get("ST Page:5"),
            "group": i18n.get("General"),
            "name": "pageLabel_5",
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page 5"),
        },
        {
            "tab": i18n.get("ST Speakers"),
            "group": i18n.get("General"),
            "name": "speakersEnabled",
            "type": "checkbox",
            "label": i18n.get("Enable Speakers"),
        },
        {                                           // user directory
            "tab": i18n.get("User Directory"),
            "group": i18n.get("User Directory"),
            "name": "searchString",
            "type": "text",
            "label": i18n.get(""),
            "text": i18n.get("Enter the partial name or email address"),
        },
        {
            "tab": i18n.get("User Directory"),
            "group": i18n.get("User Directory"),
            "name": "search",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("search")
        },
        {
            "tab": i18n.get("User Directory"),
            "group": i18n.get("User Directory"),
            "name": "searchResults",
            "text": i18n.get(""),
            "type": "description"
        }
    ],
    "alignment": [
        [
            "server",
            "domain"
        ],
        [
            "username",
            "displayname",
            "password"
        ],
        [
            "startBitrate",
            "resolution",
            "minHDHeight"
        ],
        [
            "ACTIVE_SPEAKER_AVATAR_SIZE",
            "FILM_STRIP_MAX_HEIGHT"
        ]
    ]
};

for (var p=1; p<6; p++)
{
    this.manifest.settings.push(
    {
        "tab": i18n.get("ST Page:" + p),
        "group": i18n.get("General"),
        "name": "pageEnabled_" + p,
        "type": "checkbox",
        "label": i18n.get("Enable page " + p),
    });

    for (var i=1; i<8; i++)     // row 8 is soft key area
    {
        for (var j=1; j<9; j++)
        {
            this.manifest.settings.push(
            {
                "tab": i18n.get("ST Page:" + p),
                "group": i18n.get("Cell " + i + "/" + j),
                "name": "cellEnabled_" + p + "_" + i + "_" + j,
                "type": "checkbox",
                "label": i18n.get("Enable row " + i + " col " + j),
            });

            this.manifest.settings.push(
            {
                "tab": i18n.get("ST Page:" + p),
                "group": i18n.get("Cell " + i + "/" + j),
                "name": "cellLabel_" + p + "_" + i + "_" + j,
                "type": "text",
                "label": i18n.get("Label"),
                "text": i18n.get("Enter the label for row " + i + " col " + j),
            });

            this.manifest.settings.push(
            {
                "tab": i18n.get("ST Page:" + p),
                "group": i18n.get("Cell " + i + "/" + j),
                "name": "cellValue_" + p + "_" + i + "_" + j,
                "type": "text",
                "label": i18n.get("Value"),
                "text": i18n.get("Enter the value for row " + i + " col " + j),
            });
        }
    }
}

for (var s=1; s<9; s++)
{
    this.manifest.settings.push(
    {
        "tab": i18n.get("ST Speakers"),
        "group": i18n.get("Speaker " + s),
        "name": "speakerEnabled_" + s,
        "type": "checkbox",
        "label": i18n.get("Enable speaker " + s),
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("ST Speakers"),
        "group": i18n.get("Speaker " + s),
        "name": "speakerLabel_" + s,
        "type": "text",
        "label": i18n.get("Label"),
        "text": i18n.get("Enter the label for speaker " + s),
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("ST Speakers"),
        "group": i18n.get("Speaker " + s),
        "name": "speakerValue_" + s,
        "type": "text",
        "label": i18n.get("Value"),
        "text": i18n.get("Enter the value for speaker " + s),
    });
}
