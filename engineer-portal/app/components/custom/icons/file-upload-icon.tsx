import React, { type FC } from 'react';
import type { IconProps } from "~/types";

const FileUploadIcon: FC<IconProps> = ({ className }) => {
    return (
        <svg width="46" height="40" viewBox="0 0 46 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <foreignObject x="-13.0567" y="-13.0567" width="65.9448" height="57.4094">
                <div
                    style={{
                        backdropFilter: 'blur(6.53px)',
                        clipPath: 'url(#bgblur_0_1_2_clip_path)',
                        height: '100%',
                        width: '100%'
                    }}
                />
            </foreignObject>
            <rect
                data-figma-bg-blur-radius="13.0567"
                width="39.8313"
                height="31.296"
                rx="6"
                fill="url(#paint0_linear_1_2)"
            />
            <foreignObject x="-7.36655" y="-4.52133" width="65.9448" height="57.4094">
                <div
                    style={{
                        backdropFilter: 'blur(6.53px)',
                        clipPath: 'url(#bgblur_1_1_2_clip_path)',
                        height: '100%',
                        width: '100%'
                    }}
                />
            </foreignObject>
            <rect
                data-figma-bg-blur-radius="13.0567"
                x="5.99613"
                y="8.84135"
                width="39.2194"
                height="30.6841"
                rx="5.69405"
                fill="#FF9999"
                fillOpacity="0.2"
                stroke="url(#paint1_linear_1_2)"
                strokeWidth="0.611895"
            />
            <path
                d="M34.141 36.9862L19.1054 36.9862C15.3837 36.9862 13.5229 36.9862 12.5837 36.1142C12.0321 35.6021 11.6744 34.9151 11.5712 34.1696C11.3954 32.9001 12.4626 31.3756 14.5968 28.3267C16.0469 26.2551 16.772 25.2193 17.7383 24.8671C18.3134 24.6575 18.9358 24.6138 19.5345 24.741C20.5407 24.9547 21.4034 25.879 23.1287 27.7276L25.4636 30.2293L25.4637 30.2293C25.8392 30.6317 26.027 30.8329 26.2004 30.974C27.4733 32.0099 29.3174 31.9396 30.5077 30.8099C30.6699 30.6559 30.8418 30.441 31.1857 30.0112L31.1857 30.0112C31.5539 29.551 31.738 29.3208 31.9084 29.1611C33.164 27.9839 35.118 27.9839 36.3736 29.1611C36.544 29.3208 36.7281 29.551 37.0963 30.0112L37.3443 30.3213C38.2678 31.4757 38.7296 32.0528 38.9081 32.4917C39.6353 34.2786 38.6623 36.303 36.8127 36.8515C36.3585 36.9862 35.6193 36.9862 34.141 36.9862Z"
                fill="url(#paint2_linear_1_2)"
                fillOpacity="0.9"
            />
            <rect
                x="28.4509"
                y="14.2253"
                width="8.53527"
                height="8.53527"
                rx="4.26764"
                fill="url(#paint3_linear_1_2)"
                fillOpacity="0.9"
            />
            <defs>
                <clipPath id="bgblur_0_1_2_clip_path" transform="translate(13.0567 13.0567)">
                    <rect width="39.8313" height="31.296" rx="6"/>
                </clipPath>
                <clipPath id="bgblur_1_1_2_clip_path" transform="translate(7.36655 4.52133)">
                    <rect x="5.99613" y="8.84135" width="39.2194" height="30.6841" rx="5.69405"/>
                </clipPath>
                <linearGradient id="paint0_linear_1_2" x1="11.4898" y1="6.846" x2="40.1718" y2="19.3996" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF9999"/>
                    <stop offset="1" stopColor="#F01A1A"/>
                </linearGradient>
                <linearGradient id="paint1_linear_1_2" x1="2.84509" y1="11.3805" x2="52.6342" y2="44.099" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white"/>
                    <stop offset="1" stopColor="white" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="paint2_linear_1_2" x1="15.1257" y1="29.9017" x2="45.8499" y2="39.9252" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white"/>
                    <stop offset="1" stopColor="white" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="paint3_linear_1_2" x1="28.4178" y1="16.1738" x2="44.5426" y2="26.851" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white"/>
                    <stop offset="1" stopColor="white" stopOpacity="0"/>
                </linearGradient>
            </defs>
        </svg>
    );
};

export default FileUploadIcon;