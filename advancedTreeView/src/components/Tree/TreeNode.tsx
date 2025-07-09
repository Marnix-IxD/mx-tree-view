import { ReactElement, createElement, memo, useCallback } from "react";
import { DynamicValue, WebIcon, ListAttributeValue } from "mendix";
import { TreeNode } from "../../types/TreeTypes";
import { TreeNodeContent } from "./TreeNodeContent";
import { Icon } from "../../icons/Icon";
import "./TreeNode.css";

interface TreeNodeComponentProps {
    node: TreeNode;
    nodeContent: any;
    nodeLabelAttribute: ListAttributeValue<string>;
    indentSize: number;
    showLines: boolean;
    showIcons: boolean;
    enableVisibilityToggle: boolean;
    isSelected: boolean;
    isHighlighted: boolean;
    isFocused: boolean;
    isVisible: boolean;
    isExpanded: boolean;
    isSticky: boolean;
    hasStickyAncestor: boolean;
    expandIcon?: DynamicValue<WebIcon>;
    collapseIcon?: DynamicValue<WebIcon>;
    visibilityOnIcon?: DynamicValue<WebIcon>;
    visibilityOffIcon?: DynamicValue<WebIcon>;
    onClick: () => void;
    onHover: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onToggleExpanded: () => void;
    onToggleVisibility: () => void;
}

export const TreeNodeComponent = memo(function TreeNodeComponent(props: TreeNodeComponentProps): ReactElement {
    const {
        node,
        nodeContent,
        indentSize,
        showLines,
        showIcons,
        enableVisibilityToggle,
        isSelected,
        isHighlighted,
        isFocused,
        isVisible,
        isExpanded,
        isSticky,
        hasStickyAncestor,
        onClick,
        onHover,
        onContextMenu,
        onToggleExpanded,
        onToggleVisibility
    } = props;

    // Handle expand/collapse click
    const handleExpandClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleExpanded();
    }, [onToggleExpanded]);

    // Handle visibility toggle click
    const handleVisibilityClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleVisibility();
    }, [onToggleVisibility]);

    // Calculate indentation
    const indent = node.level * indentSize;

    // Build class names
    const classNames = [
        "tree-node",
        isSelected && "tree-node--selected",
        isHighlighted && "tree-node--highlighted",
        isFocused && "tree-node--focused",
        !isVisible && "tree-node--hidden",
        isSticky && "tree-node--sticky",
        hasStickyAncestor && "tree-node--has-sticky-ancestor",
        node.isLeaf && "tree-node--leaf"
    ].filter(Boolean).join(" ");

    // Build line class names
    const lineClassNames = [
        "tree-node__lines",
        showLines && "tree-node__lines--visible"
    ].filter(Boolean).join(" ");

    return (
        <div
            className={classNames}
            onClick={onClick}
            onMouseEnter={onHover}
            onContextMenu={onContextMenu}
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={!node.isLeaf ? isExpanded : undefined}
            aria-level={node.level + 1}
            tabIndex={isFocused ? 0 : -1}
            style={{
                paddingLeft: `${indent}px`,
                position: isSticky ? "sticky" : "relative",
                top: isSticky ? 0 : undefined,
                zIndex: isSticky ? node.level + 1 : undefined
            }}
        >
            {/* Tree lines */}
            {showLines && (
                <div className={lineClassNames}>
                    {node.path.map((_, index) => (
                        <div
                            key={index}
                            className="tree-node__line"
                            style={{ left: `${index * indentSize + indentSize / 2}px` }}
                        />
                    ))}
                </div>
            )}

            {/* Expand/collapse icon */}
            {showIcons && (
                <button
                    className="tree-node__expand-button"
                    onClick={handleExpandClick}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    disabled={node.isLeaf}
                    tabIndex={-1}
                >
                    {!node.isLeaf && (
                        <Icon
                            icon={isExpanded ? props.collapseIcon : props.expandIcon}
                            fallback={isExpanded ? "chevron-down" : "chevron"}
                            className="tree-node__expand-icon"
                        />
                    )}
                </button>
            )}

            {/* Node content */}
            <div className="tree-node__content">
                <TreeNodeContent
                    node={node}
                    nodeContent={nodeContent}
                    nodeLabelAttribute={props.nodeLabelAttribute}
                    isHighlighted={isHighlighted}
                />
            </div>

            {/* Visibility toggle */}
            {enableVisibilityToggle && (
                <button
                    className="tree-node__visibility-button"
                    onClick={handleVisibilityClick}
                    aria-label={isVisible ? "Hide" : "Show"}
                    tabIndex={-1}
                >
                    <Icon
                        icon={isVisible ? props.visibilityOnIcon : props.visibilityOffIcon}
                        fallback={isVisible ? "eye-open" : "eye-closed"}
                        className="tree-node__visibility-icon"
                    />
                </button>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for performance
    return (
        prevProps.node.id === nextProps.node.id &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isHighlighted === nextProps.isHighlighted &&
        prevProps.isFocused === nextProps.isFocused &&
        prevProps.isVisible === nextProps.isVisible &&
        prevProps.isExpanded === nextProps.isExpanded &&
        prevProps.isSticky === nextProps.isSticky &&
        prevProps.hasStickyAncestor === nextProps.hasStickyAncestor
    );
});