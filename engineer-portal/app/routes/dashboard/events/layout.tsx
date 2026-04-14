import { Outlet } from "react-router"

const EventsLayout = () => {
    return (
        <section className={"py-2 lg:p-4 flex flex-col overflow-y-scroll"}>
            <h2 className={"text-xl mt-4 lg:mt-0 mb-4"}>Events & Trainings</h2>
            <Outlet />
        </section>
    )
}

export default EventsLayout