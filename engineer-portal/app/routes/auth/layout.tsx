import React from 'react';

import {VerifiedCheck} from "@solar-icons/react/ssr";
import {Outlet} from "react-router";

const AuthLayout = () => {
    const year = new Date().getFullYear();
    return (
        <div className="grid min-h-svh lg:grid-cols-2 w-full">
            <Outlet/>
            <div className="bg-white relative hidden lg:block p-4">
                <div
                    className="relative bg-[#390909] h-full w-full rounded-[50px] overflow-hidden shadow-2xl shadow-black/50 p-12 flex flex-col justify-end"
                >
                    <img
                        src="/group.png"
                        alt="Mountain landscape"
                        className="absolute inset-0 h-full w-full object-cover opacity-10"
                        style={{
                            maskImage:
                                "linear-gradient(to bottom, transparent 0%, white 100%, white 80%, transparent 100%)",
                            WebkitMaskImage:
                                "linear-gradient(to bottom, transparent 0%, white 40%, white 0%, transparent 100%)",
                        }}
                    />
                    <div
                        className="relative bg-white/0 backdrop-blur-lg/5  border border-white/50 shadow-white/50 rounded-4xl p-6 shadow-xs before:absolute before:inset-0 before:rounded-4xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none">
                        <div className="relative z-10 space-y-4 text-white">
                            <h2 className="font-semibold drop-shadow-sm">
                                Welcome to IET Engineer Portal
                            </h2>
                            <p className={"font-light text-sm"}>
                                IET is a Tanzania’s leading community of engineers dedicated to excellence, innovation,
                                and professional growth.
                            </p>
                            <div className={"space-y-2"}>
                                <p className={"font-light text-sm"}>
                                    THROUGH IET PORTAL YOU CAN :
                                </p>
                                <ul className={"font-light text-sm space-y-1"}>
                                    <li className={"flex items-center gap-2"}>
                                        <VerifiedCheck weight={"BoldDuotone"} size={20}/>
                                        <span>Register and Manage Your Membership</span>
                                    </li>
                                    <li className={"flex items-center gap-2"}>
                                        <VerifiedCheck weight={"BoldDuotone"} size={20}/>
                                        <span>Access CPD Courses</span>
                                    </li>
                                    <li className={"flex items-center gap-2"}>
                                        <VerifiedCheck weight={"BoldDuotone"} size={20}/>
                                        <span>Read the Tanzania Engineer Journal</span>
                                    </li>
                                    <li className={"flex items-center gap-2"}>
                                        <VerifiedCheck weight={"BoldDuotone"} size={20}/>
                                        <span>Track Events and Conferences </span>
                                    </li>
                                </ul>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;