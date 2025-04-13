import { useEffect, useRef } from "react";

export const useImage = (imageSrc) => {
    const imageRef = useRef(null);
    useEffect(() => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            imageRef.current = img;
        };
    }, [imageSrc]);
    return imageRef;
};