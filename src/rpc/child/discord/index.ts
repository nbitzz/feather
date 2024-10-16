import Gateway from "./gateway/Gateway.js"
import getToken from "./util/getToken.js"
const gateway = new Gateway()
const token = getToken()

if (!token) {
} else {
    await gateway.login(token)
}
