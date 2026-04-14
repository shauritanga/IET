import React from 'react';
import {Button} from "~/components/ui/button";
import {useNavigate} from "react-router";

const WelcomePage = () => {
    const navigate = useNavigate();
    return (
        <div className={"h-full flex flex-col justify-center items-center gap-12 mt-10 lg:mt-auto"}>
            <div className={"text-center"}>
                <h2 className={"text-lg font-semibold"}>Welcome to IET Engineers Portal</h2>
                <p className={"text-[#7A7773] text-sm font-light"}>
                    We are here to make your professional journey as an engineer easier.
                </p>
            </div>
            <div className={"h-50 w-50 md:h-60 md:w:60 lg:h-80 lg:w-80"}>
                <img src={"/welcome-image.png"} alt={"welcome-image"}/>
            </div>
            <Button size={'lg'} onClick={()=>navigate("/dashboard", {replace: true})}>
                Let's Get Started
            </Button>
        </div>
    );
};

export default WelcomePage;