import { Outlet } from "react-router"
import { Drawer, DrawerContent, DrawerHeader } from "~/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader } from "~/components/ui/sheet"
import { useIsMobile } from "~/hooks/useMobile";
import useRouteModal from "~/hooks/useRouteModal";


const MembershipDetailsLayout = () => {
    const { open, closeModal } = useRouteModal();
    const isMobile = useIsMobile()
    if (isMobile)
        return (
            <Drawer open={open} onOpenChange={closeModal}>
                <DrawerContent>
                    <DrawerHeader>
                        Membership Details
                    </DrawerHeader>
                    <Outlet />
                </DrawerContent>
            </Drawer>
        )

    return (
        <Sheet open={open} onOpenChange={closeModal}>
            <SheetContent>
                <SheetHeader>
                    Membership Details
                </SheetHeader>
                <Outlet />
            </SheetContent>
        </Sheet>
    )

}

export default MembershipDetailsLayout