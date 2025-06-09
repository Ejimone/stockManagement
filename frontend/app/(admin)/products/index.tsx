import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { getProducts, deleteProduct, Product } from '../../../services/api'; // Adjust path
// import { Ionicons } from '@expo/vector-icons'; // For icons

// Define a type for pagination data if your API returns it
interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
}

export default function AdminProductsScreen() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ category?: string; stock_status?: string }>({});
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


  const fetchProductsData = useCallback(async (resetPage = false) => {
    if (!resetPage) setIsLoading(true); // Full loader only on initial/filter change, not for pagination
    else if(!refreshing) setIsLoading(true); // Show loader if resetting page due to search/filter change and not already refreshing

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
        setProducts(prevProducts => [...prevProducts, ...(response.results || [])]);
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
      if(resetPage) setProducts([]); // Clear products on error if it was a fresh load
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setRefreshing(false);
    }
  }, [searchQuery, filters, refreshing]); // Add refreshing to dependencies

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
        Alert.alert("Load More", "Pagination logic with 'next' URL needs to be implemented.");
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
          }
        }
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItemContainer}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.sku || 'N/A'}</Text>
        <Text style={styles.productPrice}>Price: ${item.price?.toFixed(2) || 'N/A'}</Text>
        <Text style={styles.productStock}>Stock: {item.stock_quantity ?? 'N/A'}</Text>
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
      return <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />;
    }
    if (pagination?.next) {
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
          <Text style={styles.loadMoreButtonText}>Load More</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };


  if (isLoading && products.length === 0 && !refreshing) { // Show full page loader only if no products are visible yet
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading Products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchFilterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products by name, SKU..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {/* Placeholder for Filter Buttons/UI */}
        <View style={styles.filterControls}>
          <Text style={styles.filterPlaceholderText}>Filters: (Category, Stock Status) - UI TBD</Text>
          {/* Example: <Button title="Filter by Category" onPress={() => {}}/> */}
        </View>
      </View>

      {error && !refreshing && ( // Show error prominently if it occurs and not during a refresh
          <View style={styles.errorDisplay}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <Button title="Retry" onPress={() => fetchProductsData(true)} />
          </View>
      )}

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={() => (
          !isLoading && !error && <View style={styles.emptyListContainer}><Text style={styles.emptyListText}>No products found.</Text></View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]}/>
        }
        // ListFooterComponent={renderListFooter} // Enable when pagination logic is more robust
        // onEndReached={handleLoadMore} // Enable with onEndReachedThreshold
        // onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchFilterContainer: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    height: 45, // Slightly taller
    backgroundColor: '#F0F2F5',
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
    color: '#6C757D', // Bootstrap secondary color
    textAlign: 'center',
  },
  listContentContainer: {
    paddingBottom: 20, // Space at the bottom of the list
  },
  productItemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 6,
    marginHorizontal: 10,
    padding: 15,
    flexDirection: 'row', // Changed to row for side-by-side info and actions
    justifyContent: 'space-between',
    alignItems: 'center', // Align items vertically
    shadowColor: '#000',
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
    fontWeight: '600', // Bolder
    color: '#343A40', // Darker text
    marginBottom: 3,
  },
  productSku: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 3,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '500',
    color: '#28A745', // Green for price
    marginBottom: 3,
  },
  productStock: {
    fontSize: 14,
    color: '#17A2B8', // Info blue for stock
  },
  productActions: {
    flexDirection: 'column', // Keep actions stacked vertically for now
    alignItems: 'flex-end', // Align buttons to the right
    marginLeft: 10, // Space between info and actions
  },
  actionButton: {
    paddingVertical: 8, // More touchable area
    paddingHorizontal: 12, // More touchable area
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70, // Ensure buttons have some width
    marginVertical: 4, // Space between buttons
  },
  editButton: {
    backgroundColor: '#007BFF', // Primary blue
  },
  deleteButton: {
    backgroundColor: '#DC3545', // Danger red
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: '#6C757D',
  },
  errorDisplay: {
      padding: 15,
      alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
  },
  loadMoreButton: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#007BFF',
    marginHorizontal: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  loadMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  }
});
