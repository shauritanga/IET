import { Outlet } from "react-router"
import { Drawer, DrawerContent, DrawerHeader } from "~/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader } from "~/components/ui/sheet"
import { useIsMobile } from "~/hooks/useMobile";


interface EventDetailsLayoutProps {
    open:boolean;
    closeModal:()=>void;
}

const EventDetailsLayout = ({open, closeModal}: EventDetailsLayoutProps) => {
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

export default EventDetailsLayout