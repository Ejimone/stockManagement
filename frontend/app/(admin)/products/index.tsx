import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  Button,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { getProducts, deleteProduct, Product } from "../../../services/api"; // Adjust path
import { formatCurrency } from "../../../utils/formatters"; // Import our formatter utility
// import { Ionicons } from '@expo/vector-icons'; // For icons

// Define a type for pagination data if your API returns it
interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
}

export default function AdminProductsScreen() {
  const router = useRouter();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const searchBarPosition = useRef(new Animated.Value(0)).current;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    category?: string;
    stock_status?: string;
  }>({});
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      // Trigger search with debouncedQuery
      // For now, direct call; debounce can be added here or in fetchProductsData
      fetchProductsData(true); // Reset and fetch
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchProductsData = useCallback(
    async (resetPage = false) => {
      if (!resetPage) setIsLoading(true);
      // Full loader only on initial/filter change, not for pagination
      else if (!refreshing) setIsLoading(true); // Show loader if resetting page due to search/filter change and not already refreshing

      setError(null);
      try {
        const params: any = { search: searchQuery, ...filters };
        // If API supports pagination cursor/offset, it would be passed here
        // For now, assuming basic pagination where getProducts handles it or it's not implemented yet.

        const response = await getProducts(params); // Assuming getProducts returns { results: Product[], count?: number, next?: string, previous?: string }

        if (resetPage) {
          setProducts(response.results || []);
        } else {
          // This is a basic append, real pagination needs to handle `next` URL from API
          setProducts((prevProducts) => [
            ...prevProducts,
            ...(response.results || []),
          ]);
        }

        if (response.count !== undefined) {
          setPagination({
            count: response.count,
            next: response.next,
            previous: response.previous,
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch products:", err);
        setError(err.message || "Failed to fetch products.");
        if (resetPage) setProducts([]); // Clear products on error if it was a fresh load
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
        setRefreshing(false);
      }
    },
    [searchQuery, filters, refreshing]
  ); // Add refreshing to dependencies

  useEffect(() => {
    fetchProductsData(true); // Initial fetch or when filters change
  }, [filters]); // Removed searchQuery from here as it's handled by its own debounced useEffect

  const onRefresh = () => {
    setRefreshing(true);
    setPagination(null); // Reset pagination on refresh
    fetchProductsData(true);
  };

  const handleLoadMore = () => {
    // Basic load more: if API returns 'next' URL, you'd fetch that.
    // This example assumes getProducts itself doesn't handle page numbers directly
    // and that we'd need to pass a page param or use the 'next' URL.
    // For simplicity, this is a placeholder if not using API's next URL.
    if (pagination?.next && !isFetchingMore) {
      console.log("Attempting to load more from:", pagination.next);
      // Here you would typically parse page number from pagination.next or send it directly
      // For now, this won't actually paginate without more complex logic in getProducts or here.
      // fetchProductsData(false); // This would just re-fetch the first page with current setup
      Alert.alert(
        "Load More",
        "Pagination logic with 'next' URL needs to be implemented."
      );
    }
  };

  const handleDeleteProduct = (productId: string | number) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(productId);
              Alert.alert("Success", "Product deleted successfully.");
              fetchProductsData(true); // Refresh list
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete product.");
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItemContainer}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.sku || "N/A"}</Text>
        <Text style={styles.productPrice}>
          Price: {formatCurrency(item.price)}
        </Text>
        <Text style={styles.productStock}>
          Stock: {item.stock_quantity ?? "N/A"}
        </Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/(admin)/products/${item.id}`)}
        >
          {/* <Ionicons name="pencil-outline" size={20} color="#FFFFFF" /> */}
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteProduct(item.id)}
        >
          {/* <Ionicons name="trash-bin-outline" size={20} color="#FFFFFF" /> */}
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListFooter = () => {
    if (isFetchingMore) {
      return (
        <ActivityIndicator
          size="small"
          color="#007AFF"
          style={{ marginVertical: 20 }}
        />
      );
    }
    if (pagination?.next) {
      return (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
        >
          <Text style={styles.loadMoreButtonText}>Load More</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  useEffect(() => {
    const keyboardWillShow = (e: any) => {
      const keyboardHeight = e.endCoordinates.height;
      setKeyboardHeight(keyboardHeight);

      // Move the search bar up to stay above the keyboard
      Animated.timing(searchBarPosition, {
        toValue: -keyboardHeight + 40, // 40px above keyboard
        duration: 250,
        useNativeDriver: true,
      }).start();
    };

    const keyboardWillHide = () => {
      setKeyboardHeight(0);

      // Move the search bar back to original position
      Animated.timing(searchBarPosition, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    };

    const keyboardDidShow =
      Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
    const keyboardDidHide =
      Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";

    const showSubscription = Keyboard.addListener(
      keyboardDidShow,
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      keyboardDidHide,
      keyboardWillHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [searchBarPosition]);

  if (isLoading && products.length === 0 && !refreshing) {
    // Show full page loader only if no products are visible yet
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading Products...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {error && !refreshing && (
        <View style={styles.errorDisplay}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Button title="Retry" onPress={() => fetchProductsData(true)} />
        </View>
      )}

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContentContainer,
          { paddingBottom: Math.max(keyboardHeight, 90) + 20 },
        ]}
        ListEmptyComponent={() =>
          !isLoading &&
          !error && (
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>No products found.</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
          />
        }
      />

      <Animated.View
        style={[
          styles.floatingBottomBar,
          {
            transform: [{ translateY: searchBarPosition }],
          },
        ]}
      >
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.floatingSearchInput}
            placeholder="Search products by name, SKU..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(admin)/products/add")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingTop: 80, // Increased top margin for better spacing
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchFilterContainer: {
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchInput: {
    height: 45, // Slightly taller
    backgroundColor: "#F0F2F5",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  filterControls: {
    // Add styles for filter buttons/dropdowns container
    paddingVertical: 5,
  },
  filterPlaceholderText: {
    fontSize: 14,
    color: "#6C757D", // Bootstrap secondary color
    textAlign: "center",
  },
  listContentContainer: {
    paddingBottom: 90, // Increased to accommodate floating bar
  },
  productItemContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 6,
    marginHorizontal: 10,
    padding: 15,
    flexDirection: "row", // Changed to row for side-by-side info and actions
    justifyContent: "space-between",
    alignItems: "center", // Align items vertically
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    flex: 1, // Takes available space
  },
  productName: {
    fontSize: 17, // Slightly larger
    fontWeight: "600", // Bolder
    color: "#343A40", // Darker text
    marginBottom: 3,
  },
  productSku: {
    fontSize: 13,
    color: "#6C757D",
    marginBottom: 3,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "500",
    color: "#28A745", // Green for price
    marginBottom: 3,
  },
  productStock: {
    fontSize: 14,
    color: "#17A2B8", // Info blue for stock
  },
  productActions: {
    flexDirection: "column", // Keep actions stacked vertically for now
    alignItems: "flex-end", // Align buttons to the right
    marginLeft: 10, // Space between info and actions
  },
  actionButton: {
    paddingVertical: 8, // More touchable area
    paddingHorizontal: 12, // More touchable area
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70, // Ensure buttons have some width
    marginVertical: 4, // Space between buttons
  },
  editButton: {
    backgroundColor: "#007BFF", // Primary blue
  },
  deleteButton: {
    backgroundColor: "#DC3545", // Danger red
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: "#6C757D",
  },
  errorDisplay: {
    padding: 15,
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 10,
  },
  loadMoreButton: {
    padding: 15,
    alignItems: "center",
    backgroundColor: "#007BFF",
    marginHorizontal: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  loadMoreButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  floatingBottomBar: {
    position: "absolute",
    bottom: 30, // Increased bottom margin for better visibility
    left: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12, // Slightly increased padding
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4, // Increased shadow for better depth
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // Increased elevation for Android
    zIndex: 1000,
  },
  floatingBottomBarRaised: {
    bottom: Platform.select({
      ios: 300, // Adjust this value based on keyboard height
      android: 20,
    }),
    transform: [{ translateY: Platform.OS === "ios" ? -100 : 0 }],
  },
  searchContainer: {
    flex: 1,
    marginRight: 10,
  },
  floatingSearchInput: {
    height: 40,
    backgroundColor: "#F0F2F5",
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: "#007BFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
});
