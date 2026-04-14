import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { useNavigate } from "react-router";
import {useMembershipModalStore} from "~/stores/useMembershipModalStore";


export default function MembershipRequiredModal() {
    const { isOpen, close } = useMembershipModalStore();
    const navigate = useNavigate();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                close();
            }
        }}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#390909]/10 mx-auto mb-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-7 h-7 text-[#390909]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <DialogTitle className="text-center text-lg font-semibold">
                        Welcome to the Institution of Engineers Tanzania Portal
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-muted-foreground">
                        Your account has been successfully created, but your membership status is still pending.
                        To access all features of the portal, please complete your membership application.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex gap-2">
                    <Button
                        type="button"
                        className="w-full bg-[#390909] hover:bg-[#390909]/90"
                        size="lg"
                        onClick={() => {
                            close();
                            navigate("/application", { replace: true });
                        }}
                    >
                        Continue Application
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
