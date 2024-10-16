/**
 * @description Tries to get a token from localStorage.
 */
export default function getToken() {
    let tokens = localStorage.getItem("tokens")
        ? JSON.parse(localStorage.getItem("tokens")!)
        : undefined

    return (localStorage.getItem("token") ||
        (tokens ? Object.values(tokens)[0] : undefined)) as string | undefined
}
