import { ReactElement, createElement, useEffect, useRef, Fragment } from "react";
import { ContextMenuAction } from "../../types/TreeTypes";
import "./TreeContextMenu.scss";

interface TreeContextMenuProps {
    x: number;
    y: number;
    actions: ContextMenuAction[];
    onClose: () => void;
}

export function TreeContextMenu(props: TreeContextMenuProps): ReactElement {
    const { x, y, actions, onClose } = props;
    const menuRef = useRef<HTMLDivElement>(null);

    // Position menu to avoid going off-screen
    useEffect(() => {
        if (!menuRef.current) return;

        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = x;
        let adjustedY = y;

        // Adjust horizontal position
        if (x + rect.width > viewportWidth) {
            adjustedX = viewportWidth - rect.width - 10;
        }

        // Adjust vertical position
        if (y + rect.height > viewportHeight) {
            adjustedY = viewportHeight - rect.height - 10;
        }

        menu.style.left = `${adjustedX}px`;
        menu.style.top = `${adjustedY}px`;
    }, [x, y]);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // Delay to avoid immediate close on right-click
        setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 0);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    if (actions.length === 0) {
        return <div />;
    }

    return (
        <Fragment>
            <div className="tree-context-menu-overlay" onClick={onClose} />
            <div
                ref={menuRef}
                className="tree-context-menu"
                role="menu"
                style={{ left: x, top: y }}
            >
                {actions.map((action, index) => {
                    if (action.separator) {
                        return (
                            <div
                                key={`separator-${index}`}
                                className="tree-context-menu-item tree-context-menu-item--separator"
                                role="separator"
                            />
                        );
                    }

                    return (
                        <button
                            key={`action-${index}`}
                            className="tree-context-menu-item"
                            onClick={action.action}
                            disabled={action.disabled}
                            role="menuitem"
                        >
                            {action.icon && (
                                <span className="tree-context-menu-item__icon">
                                    {action.icon}
                                </span>
                            )}
                            <span className="tree-context-menu-item__label">
                                {action.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </Fragment>
    );
}