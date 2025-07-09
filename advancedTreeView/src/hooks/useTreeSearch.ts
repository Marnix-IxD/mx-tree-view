import { useCallback, useEffect, useMemo, useState } from "react";
import { TreeNode, TreeSearchHookProps, SearchResult, SearchMatch } from "../types/TreeTypes";
import { debounce } from "../utils/performanceUtils";
import { searchNodeAttributes } from "../utils/searchUtils";

export function useTreeSearch(props: TreeSearchHookProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Set<string>>(new Set());
    const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);

    // Debounced search function
    const debouncedSearch = useMemo(
        () => debounce((query: string) => {
            performSearch(query);
        }, props.searchDebounce),
        [props.searchDebounce]
    );

    // Perform search
    const performSearch = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults(new Set());
            setHighlightedNodes(new Set());
            return;
        }

        setIsSearching(true);

        try {
            let results: SearchResult[] = [];

            if (props.searchMode === "server" || props.searchMode === "hybrid") {
                // Server-side search
                if (props.serverSearchAction && props.serverSearchAction.canExecute) {
                    // Set the search query parameter if needed
                    // This assumes the server action expects the query somehow
                    await props.serverSearchAction.execute();
                    
                    // After server search, results should be in the datasource
                    // For hybrid mode, we'll also search client-side
                    if (props.searchMode === "hybrid") {
                        results = performClientSearch(query);
                    }
                } else if (props.searchMode === "hybrid") {
                    // Fallback to client search if server search not available
                    results = performClientSearch(query);
                }
            } else {
                // Client-side search
                results = performClientSearch(query);
            }

            // Collect node IDs and expand parents
            const nodeIds = new Set<string>();
            const nodesToExpand = new Set<string>();

            results.forEach(result => {
                nodeIds.add(result.nodeId);
                
                // Find all ancestors that need to be expanded
                let node = props.nodeMap.get(result.nodeId);
                while (node?.parentId) {
                    nodesToExpand.add(node.parentId);
                    node = props.nodeMap.get(node.parentId);
                }
            });

            // Expand nodes to show search results
            nodesToExpand.forEach(nodeId => {
                if (!props.expandedNodes.has(nodeId)) {
                    props.toggleExpanded(nodeId);
                }
            });

            setSearchResults(nodeIds);
            setHighlightedNodes(nodeIds);
        } finally {
            setIsSearching(false);
        }
    }, [props]);

    // Client-side search implementation
    const performClientSearch = useCallback((query: string): SearchResult[] => {
        const results: SearchResult[] = [];
        const searchLower = query.toLowerCase();

        props.nodes.forEach(node => {
            const matches: SearchMatch[] = [];

            // Search in configured attributes
            if (props.searchAttributes && props.searchAttributes.length > 0) {
                props.searchAttributes.forEach(attr => {
                    const value = attr.get(node.objectItem).value;
                    if (value !== null && value !== undefined) {
                        const stringValue = value.toString();
                        const valueLower = stringValue.toLowerCase();
                        const index = valueLower.indexOf(searchLower);
                        
                        if (index !== -1) {
                            matches.push({
                                attribute: attr.id,
                                value: stringValue,
                                matchedText: stringValue.substring(index, index + query.length),
                                startIndex: index,
                                endIndex: index + query.length
                            });
                        }
                    }
                });
            }

            if (matches.length > 0) {
                results.push({
                    nodeId: node.id,
                    matches
                });
            }
        });

        return results;
    }, [props.nodes, props.searchAttributes]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchQuery("");
        setSearchResults(new Set());
        setHighlightedNodes(new Set());
    }, []);

    // Handle search query change
    useEffect(() => {
        if (searchQuery) {
            debouncedSearch(searchQuery);
        } else {
            clearSearch();
        }
    }, [searchQuery, debouncedSearch, clearSearch]);

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        highlightedNodes,
        isSearching,
        clearSearch
    };
}