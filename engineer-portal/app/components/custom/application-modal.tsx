import { useEffect, useMemo } from "react"

import engineerPortalHtml from "../../../engineer-portal.html?raw"

type ApplicationModalProps = {
    open: boolean
    onClose: () => void
    userName: string
    userInitials: string
}

const CLOSE_EVENT = "IET_CLOSE_APPLICATION_MODAL"

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function buildApplicationHtml(userName: string, userInitials: string) {
    const headPatch = `
<script>
window.__IET_START_IN_DASHBOARD__ = true;
window.__IET_DISABLE_MEM_PROMPT__ = true;
document.documentElement.classList.add("iet-embedded-app");
</script>
<style>
html.iet-embedded-app .auth-wrap {
  display: none !important;
}

html.iet-embedded-app .sidebar,
html.iet-embedded-app .main {
  display: flex !important;
}

html.iet-embedded-app .main {
  flex-direction: column;
}

html.iet-embedded-app .mem-dlg-backdrop {
  display: none !important;
}
</style>`

    const closeHook = `
<style>
#apply-modal > div:last-child > div:last-child {
  max-width: none !important;
  width: calc(100vw - 300px) !important;
  display: block !important;
}

.fs-step {
  width: 100%;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 900px) {
  #apply-modal > div:last-child > div:last-child {
    width: 100vw !important;
  }

  .fs-step {
    max-width: none;
  }
}
</style>
<script>
try {
  var originalCloseModal = window.closeModal;
  window.closeModal = function () {
    if (typeof originalCloseModal === "function") originalCloseModal();
    window.parent.postMessage({ type: "${CLOSE_EVENT}" }, "*");
  };
  window.showMemPrompt = function () {};
  if (typeof window.enterDashboard === "function") window.enterDashboard();
  if (typeof window.openModal === "function") window.openModal();
} catch (error) {
  console.error(error);
}
</script>
</body>`

    let html = engineerPortalHtml.replace("<head>", `<head>${headPatch}`)
    html = html.replace("</body>", closeHook)

    if (userName.trim()) {
        html = html.replace(
            /Joram Jackson/g,
            userName,
        )
    }

    if (userInitials.trim()) {
        html = html.replace(
            new RegExp(`>${escapeRegExp("JJ")}<`, "g"),
            `>${userInitials}<`,
        )
    }

    return html
}

export default function ApplicationModal({ open, onClose, userName, userInitials }: ApplicationModalProps) {
    const frameHtml = useMemo(
        () => buildApplicationHtml(userName, userInitials),
        [userInitials, userName],
    )

    useEffect(() => {
        if (!open) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === CLOSE_EVENT) onClose()
        }

        window.addEventListener("message", handleMessage)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener("message", handleMessage)
        }
    }, [onClose, open])

    if (!open) return null

    return (
        <div className="apply-html-modal">
            <iframe
                title="IET Tanzania Membership Application"
                className="apply-html-frame"
                sandbox="allow-scripts allow-forms"
                srcDoc={frameHtml}
            />
        </div>
    )
}
