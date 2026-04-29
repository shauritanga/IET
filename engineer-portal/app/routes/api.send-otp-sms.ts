import type { ActionFunctionArgs } from "react-router"
import { normalizePhoneNumber } from "~/utils/otp-session"

type SmsPayload = {
    phoneNumber?: string
    code?: string
    recipientName?: string
}

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return Response.json({ message: "Method not allowed" }, { status: 405 })
    }

    const apiKey = process.env.BEEM_API_KEY
    const secretKey = process.env.BEEM_SECRET_KEY
    const sourceAddr = process.env.BEEM_SOURCE_ADDR

    if (!apiKey || !secretKey || !sourceAddr) {
        return Response.json({ message: "Beem SMS is not configured" }, { status: 500 })
    }

    let payload: SmsPayload
    try {
        payload = await request.json()
    } catch {
        return Response.json({ message: "Invalid request body" }, { status: 400 })
    }

    const normalizedPhone = normalizePhoneNumber(payload.phoneNumber ?? "")
    const code = payload.code?.trim()

    if (!normalizedPhone || normalizedPhone.length < 12) {
        return Response.json({ message: "Valid phone number is required" }, { status: 400 })
    }

    if (!code || code.length !== 6) {
        return Response.json({ message: "Valid OTP code is required" }, { status: 400 })
    }

    const message = payload.recipientName?.trim()
        ? `Hello ${payload.recipientName.trim()}, your IET Tanzania verification code is ${code}.`
        : `Your IET Tanzania verification code is ${code}.`

    const beemResponse = await fetch("https://apisms.beem.africa/v1/send", {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            source_addr: sourceAddr,
            encoding: 0,
            schedule_time: "",
            message,
            recipients: [
                {
                    recipient_id: "1",
                    dest_addr: normalizedPhone,
                },
            ],
        }),
    })

    const data = await beemResponse.json().catch(() => null)
    if (!beemResponse.ok) {
        return Response.json(
            { message: "Failed to send SMS via Beem", details: data },
            { status: beemResponse.status || 502 },
        )
    }

    return Response.json({
        success: true,
        message: "SMS sent successfully",
        provider: data,
    })
}
