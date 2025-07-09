import { useCallback, useEffect } from "react";
import { TreeKeyboardHookProps } from "../types/TreeTypes";

export function useTreeKeyboard(props: TreeKeyboardHookProps) {
    const {
        containerRef,
        nodes,
        nodeMap,
        expandedNodes,
        selectedNodes,
        focusedNodeId,
        setFocusedNodeId,
        toggleExpanded,
        toggleSelection,
        selectNode,
        clearSelection,
        enabled
    } = props;

    // Get flat list of visible nodes
    const getVisibleNodes = useCallback(() => {
        const visible: string[] = [];

        const traverse = (nodeId: string) => {
            visible.push(nodeId);
            const node = nodeMap.get(nodeId);
            if (node && expandedNodes.has(nodeId) && node.children.length > 0) {
                node.children.forEach(child => traverse(child.id));
            }
        };

        // Start from root nodes
        nodes.forEach(node => {
            if (!node.parentId) {
                traverse(node.id);
            }
        });

        return visible;
    }, [nodes, nodeMap, expandedNodes]);

    // Navigate to previous/next node
    const navigateToNode = useCallback((direction: "up" | "down") => {
        const visibleNodes = getVisibleNodes();
        if (visibleNodes.length === 0) return;

        const currentIndex = focusedNodeId ? 
            visibleNodes.indexOf(focusedNodeId) : -1;

        let newIndex: number;
        if (direction === "up") {
            newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        } else {
            newIndex = currentIndex < visibleNodes.length - 1 ? 
                currentIndex + 1 : visibleNodes.length - 1;
        }

        const newNodeId = visibleNodes[newIndex];
        if (newNodeId) {
            setFocusedNodeId(newNodeId);
            scrollNodeIntoView(newNodeId);
        }
    }, [focusedNodeId, setFocusedNodeId, getVisibleNodes]);

    // Navigate to parent node
    const navigateToParent = useCallback(() => {
        if (!focusedNodeId) return;

        const node = nodeMap.get(focusedNodeId);
        if (node?.parentId) {
            setFocusedNodeId(node.parentId);
            scrollNodeIntoView(node.parentId);
        }
    }, [focusedNodeId, nodeMap, setFocusedNodeId]);

    // Navigate to first child
    const navigateToFirstChild = useCallback(() => {
        if (!focusedNodeId) return;

        const node = nodeMap.get(focusedNodeId);
        if (node && !node.isLeaf && expandedNodes.has(node.id) && node.children.length > 0) {
            const firstChildId = node.children[0].id;
            setFocusedNodeId(firstChildId);
            scrollNodeIntoView(firstChildId);
        }
    }, [focusedNodeId, nodeMap, expandedNodes, setFocusedNodeId]);

    // Scroll node into view
    const scrollNodeIntoView = useCallback((nodeId: string) => {
        if (!containerRef.current) return;

        // Find the node element
        const nodeElement = containerRef.current.querySelector(
            `[role="treeitem"][aria-level]`
        );

        if (nodeElement) {
            nodeElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }
    }, [containerRef]);

    // Handle keyboard events
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled || !containerRef.current?.contains(event.target as Node)) {
            return;
        }

        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        const isShift = event.shiftKey;

        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                if (isShift && focusedNodeId) {
                    // Extend selection up
                    const visibleNodes = getVisibleNodes();
                    const currentIndex = visibleNodes.indexOf(focusedNodeId);
                    if (currentIndex > 0) {
                        const prevNodeId = visibleNodes[currentIndex - 1];
                        toggleSelection(prevNodeId);
                        setFocusedNodeId(prevNodeId);
                    }
                } else {
                    navigateToNode("up");
                }
                break;

            case "ArrowDown":
                event.preventDefault();
                if (isShift && focusedNodeId) {
                    // Extend selection down
                    const visibleNodes = getVisibleNodes();
                    const currentIndex = visibleNodes.indexOf(focusedNodeId);
                    if (currentIndex < visibleNodes.length - 1) {
                        const nextNodeId = visibleNodes[currentIndex + 1];
                        toggleSelection(nextNodeId);
                        setFocusedNodeId(nextNodeId);
                    }
                } else {
                    navigateToNode("down");
                }
                break;

            case "ArrowLeft":
                event.preventDefault();
                if (!focusedNodeId) return;

                const leftNode = nodeMap.get(focusedNodeId);
                if (leftNode && !leftNode.isLeaf && expandedNodes.has(focusedNodeId)) {
                    // Collapse node
                    toggleExpanded(focusedNodeId);
                } else {
                    // Navigate to parent
                    navigateToParent();
                }
                break;

            case "ArrowRight":
                event.preventDefault();
                if (!focusedNodeId) return;

                const rightNode = nodeMap.get(focusedNodeId);
                if (rightNode && !rightNode.isLeaf) {
                    if (!expandedNodes.has(focusedNodeId)) {
                        // Expand node
                        toggleExpanded(focusedNodeId);
                    } else {
                        // Navigate to first child
                        navigateToFirstChild();
                    }
                }
                break;

            case "Enter":
            case " ": // Space
                event.preventDefault();
                if (focusedNodeId) {
                    if (event.key === " " && !nodeMap.get(focusedNodeId)?.isLeaf) {
                        // Space toggles expansion
                        toggleExpanded(focusedNodeId);
                    } else {
                        // Enter selects node
                        selectNode(focusedNodeId);
                    }
                }
                break;

            case "Home":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    // Go to first node
                    const visibleNodes = getVisibleNodes();
                    if (visibleNodes.length > 0) {
                        setFocusedNodeId(visibleNodes[0]);
                        scrollNodeIntoView(visibleNodes[0]);
                    }
                }
                break;

            case "End":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    // Go to last node
                    const visibleNodes = getVisibleNodes();
                    if (visibleNodes.length > 0) {
                        const lastId = visibleNodes[visibleNodes.length - 1];
                        setFocusedNodeId(lastId);
                        scrollNodeIntoView(lastId);
                    }
                }
                break;

            case "a":
            case "A":
                if (isCtrlOrCmd) {
                    event.preventDefault();
                    // Select all visible nodes
                    const visibleNodes = getVisibleNodes();
                    visibleNodes.forEach(nodeId => {
                        if (!selectedNodes.has(nodeId)) {
                            toggleSelection(nodeId);
                        }
                    });
                }
                break;

            case "Escape":
                event.preventDefault();
                clearSelection();
                break;

            case "*":
                // Expand all siblings
                event.preventDefault();
                if (focusedNodeId) {
                    const node = nodeMap.get(focusedNodeId);
                    if (node?.parentId) {
                        const parent = nodeMap.get(node.parentId);
                        parent?.children.forEach(sibling => {
                            if (!sibling.isLeaf && !expandedNodes.has(sibling.id)) {
                                toggleExpanded(sibling.id);
                            }
                        });
                    }
                }
                break;
        }
    }, [
        enabled,
        containerRef,
        focusedNodeId,
        nodeMap,
        expandedNodes,
        selectedNodes,
        navigateToNode,
        navigateToParent,
        navigateToFirstChild,
        toggleExpanded,
        toggleSelection,
        selectNode,
        clearSelection,
        setFocusedNodeId,
        scrollNodeIntoView,
        getVisibleNodes
    ]);

    // Attach keyboard event listeners
    useEffect(() => {
        if (!enabled) return;

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [enabled, handleKeyDown]);

    // Focus management
    useEffect(() => {
        if (!containerRef.current || !focusedNodeId) return;

        // Find and focus the node element
        const nodeElement = containerRef.current.querySelector(
            `[role="treeitem"][tabindex="0"]`
        ) as HTMLElement;

        if (nodeElement && document.activeElement !== nodeElement) {
            nodeElement.focus();
        }
    }, [containerRef, focusedNodeId]);
}