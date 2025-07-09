import { useCallback, useReducer, useState } from "react";
import { TreeNode, TreeStateHookProps, TreeAction } from "../types/TreeTypes";

interface TreeState {
    expandedNodes: Set<string>;
    visibleNodes: Set<string>;
}

interface HistoryState {
    past: TreeAction[];
    future: TreeAction[];
}

function treeReducer(state: TreeState, action: TreeAction): TreeState {
    switch (action.type) {
        case "TOGGLE_EXPANDED": {
            const nodeId = action.payload;
            const newExpanded = new Set(state.expandedNodes);
            
            if (newExpanded.has(nodeId)) {
                newExpanded.delete(nodeId);
            } else {
                newExpanded.add(nodeId);
            }
            
            return { ...state, expandedNodes: newExpanded };
        }
        
        case "TOGGLE_VISIBILITY": {
            const nodeId = action.payload;
            const newVisible = new Set(state.visibleNodes);
            
            if (newVisible.has(nodeId)) {
                newVisible.delete(nodeId);
            } else {
                newVisible.add(nodeId);
            }
            
            return { ...state, visibleNodes: newVisible };
        }
        
        case "EXPAND_ALL": {
            const nodeIds = action.payload as string[];
            const newExpanded = new Set(state.expandedNodes);
            nodeIds.forEach(id => newExpanded.add(id));
            return { ...state, expandedNodes: newExpanded };
        }
        
        case "COLLAPSE_ALL": {
            return { ...state, expandedNodes: new Set() };
        }
        
        case "EXPAND_TO_LEVEL": {
            const { nodes, level } = action.payload;
            const newExpanded = new Set<string>();
            
            const expandToLevel = (node: TreeNode, currentLevel: number) => {
                if (currentLevel < level && !node.isLeaf) {
                    newExpanded.add(node.id);
                    node.children.forEach(child => expandToLevel(child, currentLevel + 1));
                }
            };
            
            nodes.forEach((node: TreeNode) => expandToLevel(node, 0));
            return { ...state, expandedNodes: newExpanded };
        }
        
        default:
            return state;
    }
}

export function useTreeState(props: TreeStateHookProps) {
    // Initialize state from attributes
    const initialState: TreeState = {
        expandedNodes: new Set(),
        visibleNodes: new Set()
    };

    // Initialize expanded and visible states from attributes
    props.nodes.forEach(node => {
        if (props.expandedAttribute) {
            const isExpanded = props.expandedAttribute.get(node.objectItem).value;
            if (isExpanded) {
                initialState.expandedNodes.add(node.id);
            }
        }
        
        if (props.visibilityAttribute) {
            const isVisible = props.visibilityAttribute.get(node.objectItem).value;
            if (isVisible !== false) { // Default to visible
                initialState.visibleNodes.add(node.id);
            }
        } else {
            // If no visibility attribute, all nodes are visible
            initialState.visibleNodes.add(node.id);
        }
    });

    const [state, dispatch] = useReducer(treeReducer, initialState);
    const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });

    // Dispatch with history tracking
    const dispatchWithHistory = useCallback((action: TreeAction) => {
        if (props.enableUndoRedo) {
            setHistory(prev => ({
                past: [...prev.past, action],
                future: [] // Clear future on new action
            }));
        }
        dispatch(action);
    }, [props.enableUndoRedo]);

    // Toggle node expansion
    const toggleExpanded = useCallback((nodeId: string) => {
        const node = props.nodeMap.get(nodeId);
        if (!node) return;

        // Update attribute if configured
        if (props.expandedAttribute) {
            const isExpanded = state.expandedNodes.has(nodeId);
            props.expandedAttribute.get(node.objectItem).setValue(!isExpanded);
        }

        // Handle expand mode
        if (props.expandMode === "single") {
            // Collapse siblings when expanding
            const isExpanding = !state.expandedNodes.has(nodeId);
            if (isExpanding && node.parentId) {
                const parent = props.nodeMap.get(node.parentId);
                if (parent) {
                    parent.children.forEach(sibling => {
                        if (sibling.id !== nodeId && state.expandedNodes.has(sibling.id)) {
                            dispatchWithHistory({
                                type: "TOGGLE_EXPANDED",
                                payload: sibling.id,
                                timestamp: Date.now()
                            });
                        }
                    });
                }
            }
        }

        dispatchWithHistory({
            type: "TOGGLE_EXPANDED",
            payload: nodeId,
            timestamp: Date.now()
        });
    }, [props, state.expandedNodes, dispatchWithHistory]);

    // Toggle node visibility
    const toggleVisibility = useCallback((nodeId: string) => {
        const node = props.nodeMap.get(nodeId);
        if (!node) return;

        // Get all descendant IDs
        const getDescendantIds = (n: TreeNode): string[] => {
            const ids = [n.id];
            n.children.forEach(child => ids.push(...getDescendantIds(child)));
            return ids;
        };

        const affectedIds = getDescendantIds(node);
        const isVisible = state.visibleNodes.has(nodeId);

        // Update visibility for node and all descendants
        affectedIds.forEach(id => {
            const affectedNode = props.nodeMap.get(id);
            if (affectedNode && props.visibilityAttribute) {
                props.visibilityAttribute.get(affectedNode.objectItem).setValue(!isVisible);
            }
        });

        // Update state for all affected nodes
        affectedIds.forEach(id => {
            dispatchWithHistory({
                type: "TOGGLE_VISIBILITY",
                payload: id,
                timestamp: Date.now()
            });
        });

        // Execute visibility change action
        if (props.onVisibilityChange && props.onVisibilityChange.canExecute) {
            props.onVisibilityChange.execute();
        }
    }, [props, state.visibleNodes, dispatchWithHistory]);

    // Expand all nodes
    const expandAll = useCallback(() => {
        const allExpandableIds = props.nodes
            .filter(node => !node.isLeaf)
            .map(node => node.id);

        dispatchWithHistory({
            type: "EXPAND_ALL",
            payload: allExpandableIds,
            timestamp: Date.now()
        });

        // Update attributes
        if (props.expandedAttribute) {
            allExpandableIds.forEach(id => {
                const node = props.nodeMap.get(id);
                if (node) {
                    props.expandedAttribute.get(node.objectItem).setValue(true);
                }
            });
        }
    }, [props, dispatchWithHistory]);

    // Collapse all nodes
    const collapseAll = useCallback(() => {
        dispatchWithHistory({
            type: "COLLAPSE_ALL",
            payload: null,
            timestamp: Date.now()
        });

        // Update attributes
        if (props.expandedAttribute) {
            props.nodes.forEach(node => {
                if (!node.isLeaf) {
                    props.expandedAttribute.get(node.objectItem).setValue(false);
                }
            });
        }
    }, [props, dispatchWithHistory]);

    // Expand to specific level
    const expandToLevel = useCallback((level: number) => {
        // Get root nodes
        const rootNodes = props.nodes.filter(node => !node.parentId);

        dispatchWithHistory({
            type: "EXPAND_TO_LEVEL",
            payload: { nodes: rootNodes, level },
            timestamp: Date.now()
        });
    }, [props.nodes, dispatchWithHistory]);

    // Set visibility for specific node
    const setNodeVisibility = useCallback((nodeId: string, visible: boolean) => {
        const node = props.nodeMap.get(nodeId);
        if (!node) return;

        if (props.visibilityAttribute) {
            props.visibilityAttribute.get(node.objectItem).setValue(visible);
        }

        if ((visible && !state.visibleNodes.has(nodeId)) || 
            (!visible && state.visibleNodes.has(nodeId))) {
            dispatchWithHistory({
                type: "TOGGLE_VISIBILITY",
                payload: nodeId,
                timestamp: Date.now()
            });
        }
    }, [props, state.visibleNodes, dispatchWithHistory]);

    // Undo/Redo functionality
    const undoAction = useCallback(() => {
        if (history.past.length === 0) return;

        const lastAction = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);
        
        setHistory({
            past: newPast,
            future: [lastAction, ...history.future]
        });

        // Reverse the action
        dispatch(lastAction);
    }, [history]);

    const redoAction = useCallback(() => {
        if (history.future.length === 0) return;

        const nextAction = history.future[0];
        const newFuture = history.future.slice(1);
        
        setHistory({
            past: [...history.past, nextAction],
            future: newFuture
        });

        dispatch(nextAction);
    }, [history]);

    return {
        expandedNodes: state.expandedNodes,
        visibleNodes: state.visibleNodes,
        toggleExpanded,
        toggleVisibility,
        expandAll,
        collapseAll,
        expandToLevel,
        setNodeVisibility,
        undoAction,
        redoAction,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0
    };
}