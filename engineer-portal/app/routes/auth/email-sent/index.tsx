import { redirect } from "react-router"

export const loader = () => redirect("/auth/login")

export default function EmailSent() {
    return null
}
