import { ReactElement, createElement } from "react";
import { DynamicValue, WebIcon } from "mendix";
import { ChevronIcon } from "./ChevronIcon";
import { EyeIcon } from "./EyeIcon";
import { SearchIcon } from "./SearchIcon";

interface IconProps {
    icon?: DynamicValue<WebIcon>;
    fallback: "chevron" | "chevron-down" | "eye-open" | "eye-closed" | "search";
    className?: string;
}

export function Icon({ icon, fallback, className }: IconProps): ReactElement | null {
    // If a custom icon is provided and has a value, use it
    if (icon && icon.value) {
        // Mendix icons can be either a glyph or an image
        if (icon.value.type === "glyph") {
            return (
                <span className={`${className} ${icon.value.iconClass}`} aria-hidden="true" />
            );
        } else if (icon.value.type === "image") {
            return (
                <img 
                    className={className}
                    src={icon.value.iconUrl} 
                    alt=""
                    aria-hidden="true"
                />
            );
        }
    }

    // Otherwise, use the fallback icon
    switch (fallback) {
        case "chevron":
            return <ChevronIcon className={className} />;
        case "chevron-down":
            return (
                <div className={className} style={{ transform: "rotate(90deg)" }}>
                    <ChevronIcon />
                </div>
            );
        case "eye-open":
            return <EyeIcon className={className} isClosed={false} />;
        case "eye-closed":
            return <EyeIcon className={className} isClosed={true} />;
        case "search":
            return <SearchIcon className={className} />;
        default:
            return null;
    }
}