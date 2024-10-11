import browser from "webextension-polyfill"

const frame = document.createElement("iframe")
frame.src = "https://discord.com/humans.txt?__feather_rpc_slave"