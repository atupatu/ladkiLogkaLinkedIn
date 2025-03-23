import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Image,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Animated,
  Share,
  Keyboard
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

const BASE_URL = 'http://10.45.71.76:5000';

export default function CommunityScreen({ route, navigation }) {
  const { token } = route.params;
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [activePostId, setActivePostId] = useState(null);
  const [selectedTag, setSelectedTag] = useState('');
  const [tags, setTags] = useState(['Wellness', 'Fitness', 'Nutrition', 'Mental Health', 'Motivation']);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [showPostInput, setShowPostInput] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  
  // Animation values
  const postInputHeight = useRef(new Animated.Value(135)).current;
  const commentInputRef = useRef(null);
  const flatListRef = useRef(null);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      let url = `${BASE_URL}/api/community/posts`;
      
      if (selectedTag) {
        url += `?tag=${selectedTag}`;
      }
      
      const response = await axios.get(url, {
        headers: { 'x-auth-token': token },
      });
      setPosts(response.data);
      
      // Initialize liked status for each post
      const initialLikedStatus = {};
      response.data.forEach(post => {
        initialLikedStatus[post._id] = post.likes.some(like => like._id === route.params.userId);
      });
      setLikedPosts(initialLikedStatus);
      
      setIsLoading(false);
    } catch (error) {
      console.error(error.response?.data || error.message);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load posts. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      // Ask for permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      // Pick image
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const createPost = async () => {
    if (!content.trim() && !selectedImage) {
      Alert.alert('Error', 'Please add some content or an image to post.');
      return;
    }
    
    Keyboard.dismiss();
    
    try {
      setIsPosting(true);
      
      const formData = new FormData();
      formData.append('content', content);
      
      if (selectedTags.length > 0) {
        formData.append('tags', JSON.stringify(selectedTags));
      }
      
      if (selectedImage) {
        const filename = selectedImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        
        formData.append('image', {
          uri: selectedImage,
          name: filename,
          type
        });
      }
      
      await axios.post(
        `${BASE_URL}/api/community/posts`,
        formData,
        { 
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      setContent('');
      setSelectedImage(null);
      setSelectedTags([]);
      await fetchPosts();
      setIsPosting(false);
      
      // Show success feedback
      Alert.alert('Success', 'Your post has been shared with the community!');
      
      // Scroll to top to show the new post
      if (flatListRef.current && posts.length > 0) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error) {
      console.error(error.response?.data || error.message);
      setIsPosting(false);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  const handleLike = async (postId) => {
    // Optimistic UI update
    const currentLikedStatus = likedPosts[postId] || false;
    
    // Update the liked status immediately for responsive UI
    setLikedPosts({
      ...likedPosts,
      [postId]: !currentLikedStatus
    });
    
    // Update the post likes count optimistically
    setPosts(posts.map(post => {
      if (post._id === postId) {
        let updatedLikes = [...post.likes];
        if (currentLikedStatus) {
          // Remove the user's like
          updatedLikes = updatedLikes.filter(like => like._id !== route.params.userId);
        } else {
          // Add the user's like
          updatedLikes.push({ _id: route.params.userId });
        }
        return { ...post, likes: updatedLikes };
      }
      return post;
    }));
    
    try {
      const response = await axios.put(
        `${BASE_URL}/api/community/posts/${postId}/like`,
        {},
        { headers: { 'x-auth-token': token } }
      );
      
      // Update posts with the server response
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', 'Failed to like post. Please try again.');
      
      // Revert optimistic update on error
      setLikedPosts({
        ...likedPosts,
        [postId]: currentLikedStatus
      });
      
      // Revert the post likes count
      setPosts(posts);
    }
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) {
      return;
    }
    
    Keyboard.dismiss();
    
    try {
      // Show submitting indicator
      const tempComment = {
        _id: 'temp-' + Date.now(),
        text: commentText,
        user: { name: 'You' }, // Assuming we know the user name
        createdAt: new Date().toISOString(),
        isSubmitting: true
      };
      
      // Optimistically add the comment
      setPosts(posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...post.comments, tempComment]
          };
        }
        return post;
      }));
      
      // Clear input field immediately for better UX
      setCommentText('');
      
      const response = await axios.post(
        `${BASE_URL}/api/community/posts/${postId}/comments`,
        { text: commentText },
        { headers: { 'x-auth-token': token } }
      );
      
      // Update posts with the server response
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
      
      // Remove the temporary comment on error
      setPosts(posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: post.comments.filter(c => !c.isSubmitting)
          };
        }
        return post;
      }));
    }
  };

  const handleShare = async (post) => {
    try {
      const result = await Share.share({
        message: `Check out this post from the health community: "${post.content}"`,
        url: `${BASE_URL}/share/post/${post._id}`, // Assuming there's a web share endpoint
        title: 'Share Community Post'
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          console.log(`Shared via ${result.activityType}`);
        } else {
          // Shared
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share the post. Please try again.');
    }
  };

  const toggleComments = (postId) => {
    // Hide post input when comments are opened
    if (!showComments[postId]) {
      setShowPostInput(false);
      hidePostInput();
    } else {
      setShowPostInput(true);
      showPostInputBox();
    }
    
    setShowComments({
      ...showComments,
      [postId]: !showComments[postId]
    });
    
    setActivePostId(postId);
    
    // Focus the comment input if showing comments
    if (!showComments[postId] && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current.focus();
      }, 300);
    }
  };

  const hidePostInput = () => {
    Animated.timing(postInputHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false
    }).start();
  };

  const showPostInputBox = () => {
    Animated.timing(postInputHeight, {
      toValue: 135,
      duration: 300,
      useNativeDriver: false
    }).start();
  };

  const toggleTagSelection = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const applyTagFilter = (tag) => {
    setSelectedTag(tag);
    setShowTagFilter(false);
    fetchPosts();
  };

  const clearFilter = () => {
    setSelectedTag('');
    fetchPosts();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [selectedTag]);

  useEffect(() => {
    fetchPosts();
  }, [selectedTag]);

  // Close keyboard when tapping outside input fields
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (commentInputRef.current) {
        commentInputRef.current.blur();
      }
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const renderPost = ({ item }) => {
    const date = new Date(item.createdAt);
    const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const isLiked = likedPosts[item._id] || false;
    
    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <Image 
            source={{ uri: 'https://i.imgur.com/placeholder.png' }} // Replace with user avatar or default
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.postTime}>{formattedDate}</Text>
          </View>
        </View>
        
        <Text style={styles.postContent}>{item.content}</Text>
        
        {item.imageUrl && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => {
              // Logic to view image in full screen if needed
            }}
          >
            <Image 
              source={{ uri: `${BASE_URL}${item.imageUrl}` }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => applyTagFilter(tag)}
                style={styles.tagButton}
              >
                <Text style={styles.tagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <View style={styles.postStats}>
          <Text style={styles.statsText}>
            {item.likes.length} {item.likes.length === 1 ? 'like' : 'likes'} • {item.comments.length} {item.comments.length === 1 ? 'comment' : 'comments'}
          </Text>
        </View>
        
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleLike(item._id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={isLiked ? "#d94c86" : "#666666"} 
            />
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>Like</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => toggleComments(item._id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={showComments[item._id] ? "chatbubble" : "chatbubble-outline"} 
              size={20} 
              color={showComments[item._id] ? "#d94c86" : "#666666"} 
            />
            <Text style={[styles.actionText, showComments[item._id] && styles.actionTextActive]}>
              Comment
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={20} color="#666666" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
        
        {showComments[item._id] && (
          <View style={styles.commentsSection}>
            {item.comments.length > 0 ? (
              <View style={styles.commentsList}>
                {item.comments.map((comment, index) => (
                  <View key={comment._id || index} style={styles.commentItem}>
                    <Image 
                      source={{ uri: 'https://i.imgur.com/placeholder.png' }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUserName}>{comment.user.name}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                      <Text style={styles.commentTime}>
                        {comment.isSubmitting ? 'Sending...' : new Date(comment.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
            )}
            
            <View style={styles.addCommentSection}>
              <TextInput
                ref={item._id === activePostId ? commentInputRef : null}
                value={activePostId === item._id ? commentText : ''}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                style={styles.commentInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, commentText.trim() ? styles.sendButtonActive : {}]}
                onPress={() => handleComment(item._id)}
                disabled={!commentText.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={18} 
                  color={commentText.trim() ? "#fff" : "#666666"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowTagFilter(true)}
        >
          <Ionicons name="filter" size={22} color="#d94c86" />
        </TouchableOpacity>
      </View>

      {selectedTag ? (
        <View style={styles.filterInfo}>
          <Text style={styles.filterText}>Filtering by: #{selectedTag}</Text>
          <TouchableOpacity 
            onPress={clearFilter}
            style={styles.clearFilterButton}
          >
            <Ionicons name="close-circle" size={18} color="#d94c86" />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.mainContainer}>
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={["#d94c86"]} 
              tintColor="#d94c86"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#d94c86" style={{opacity: 0.5, marginBottom: 20}} />
              <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          {showPostInput && (
            <>
              <ScrollView style={styles.inputScrollView}>
                {selectedImage && (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => setSelectedImage(null)}
                    >
                      <Ionicons name="close-circle" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {selectedTags.length > 0 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.selectedTagsContainer}
                  >
                    {selectedTags.map((tag, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.selectedTagItem}
                        onPress={() => toggleTagSelection(tag)}
                      >
                        <Text style={styles.selectedTagText}>{tag}</Text>
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Share your thoughts with the community..."
                  placeholderTextColor="#8b8b8b"
                  multiline
                  style={styles.input}
                  maxLength={500}
                />
              </ScrollView>

              <View style={styles.inputActions}>
                <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                  <Ionicons name="image-outline" size={22} color="#d94c86" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.tagButton} onPress={() => setShowTagModal(true)}>
                  <Ionicons name="pricetag-outline" size={22} color="#d94c86" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.postButton, (!content.trim() && !selectedImage) && styles.postButtonDisabled]}
                  onPress={createPost}
                  disabled={isPosting || (!content.trim() && !selectedImage)}
                >
                  {isPosting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.postButtonText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Tag Selection Modal */}
      <Modal
        visible={showTagModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTagModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowTagModal(false)}
        >
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Tags</Text>
              <TouchableOpacity onPress={() => setShowTagModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.tagsList}>
              {tags.map((tag, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.tagItem,
                    selectedTags.includes(tag) && styles.tagItemSelected
                  ]}
                  onPress={() => toggleTagSelection(tag)}
                >
                  <Text style={[
                    styles.tagItemText,
                    selectedTags.includes(tag) && styles.tagItemTextSelected
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => setShowTagModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Tag Filter Modal */}
      <Modal
        visible={showTagFilter}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTagFilter(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowTagFilter(false)}
        >
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Posts by Tag</Text>
              <TouchableOpacity onPress={() => setShowTagFilter(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.tagItem, !selectedTag && styles.tagItemSelected]}
              onPress={() => {
                setSelectedTag('');
                setShowTagFilter(false);
                fetchPosts();
              }}
            >
              <Text style={[styles.tagItemText, !selectedTag && styles.tagItemTextSelected]}>
                All Posts
              </Text>
            </TouchableOpacity>
            
            <View style={styles.tagsList}>
              {tags.map((tag, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.tagItem,
                    selectedTag === tag && styles.tagItemSelected
                  ]}
                  onPress={() => applyTagFilter(tag)}
                >
                  <Text style={[
                    styles.tagItemText,
                    selectedTag === tag && styles.tagItemTextSelected
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d94c86',
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff3f8',
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff3f8',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  filterText: {
    fontSize: 14,
    color: '#d94c86',
    fontWeight: '500',
  },
  clearFilterButton: {
    padding: 5,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
    fontSize: 16,
  },
  postContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f1f1',
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontWeight: '700',
    fontSize: 16,
    color: '#333333',
  },
  postTime: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
    marginBottom: 15,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#f1f1f1',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tagButton: {
    marginRight: 8,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 13,
    color: '#d94c86',
  },
  postStats: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  statsText: {
    fontSize: 13,
    color: '#888888',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  actionText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 5,
  },
  actionTextActive: {
    color: '#d94c86',
  },
  commentsSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
  },
  commentsList: {
    maxHeight: 300,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f1f1',
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#f7f7f7',
    padding: 10,
    borderRadius: 10,
  },
  commentUserName: {
    fontWeight: '600',
    fontSize: 13,
    color: '#333333',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333333',
  },
  commentTime: {
    fontSize: 11,
    color: '#888888',
    marginTop: 5,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#888888',
    padding: 10,
  },
  addCommentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f1f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonActive: {
    backgroundColor: '#d94c86',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxHeight: 200, // Set maximum height
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  selectedTagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d94c86',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedTagText: {
    color: '#ffffff',
    fontSize: 13,
    marginRight: 5,
  },
  inputRow: {
    flexDirection: 'column',
  },
  input: {
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 80, // Limit input height
    color: '#333333',
    marginBottom: 10,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  mediaButton: {
    padding: 8,
  },
  postButton: {
    backgroundColor: '#d94c86',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#f0a8c5',
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tagItem: {
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
  },
  tagItemSelected: {
    backgroundColor: '#d94c86',
  },
  tagItemText: {
    color: '#333333',
  },
  tagItemTextSelected: {
    color: '#ffffff',
  },
  doneButton: {
    backgroundColor: '#d94c86',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  inputScrollView: {
    maxHeight: 150, // Adjust this value as needed
  },
});