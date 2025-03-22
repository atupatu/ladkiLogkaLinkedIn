import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { Video } from 'expo-av';
import axios from 'axios';

export default function LessonsScreen({ route, navigation }) {
  const { token } = route.params;
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://10.45.71.76:5000/api/lessons', {
        headers: { 'x-auth-token': token },
      });
      setLessons(response.data);
      setError(null);
    } catch (error) {
      console.error(error.response?.data || error.message);
      setError('Unable to load lessons. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const renderLessonItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.lessonCard}
      onPress={() => navigation.navigate('LessonDetail', { lesson: item, token })}
    >
      <View style={styles.lessonContent}>
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonTitle}>{item.title}</Text>
          <View style={styles.durationContainer}>
            <Text style={styles.lessonDuration}>
              {item.duration || '20'} min
            </Text>
          </View>
        </View>
        
        {item.videoUrl ? (
          <Video 
            source={{ uri: item.videoUrl }} 
            style={styles.videoThumbnail}
            resizeMode="cover"
            useNativeControls={false}
            posterSource={{ uri: item.thumbnailUrl || 'https://i.imgur.com/placeholder.png' }}
            posterStyle={styles.videoThumbnail}
            isLooping={false}
          />
        ) : (
          <Image 
            source={{ uri: item.thumbnailUrl || 'https://i.imgur.com/placeholder.png' }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
        )}
        
        <Text style={styles.lessonDescription}>
          {item.description || 'Learn valuable skills to advance your career and personal growth.'}
        </Text>
        
        <View style={styles.skillsContainer}>
          <Text style={styles.skillsLabel}>Skills: </Text>
          <View style={styles.skillsWrapper}>
            {item.skills && item.skills.map((skill, index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Lesson</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Lessons</Text>
        <TouchableOpacity 
          style={styles.shaktiButton}
          onPress={() => navigation.navigate('Shakti', { token })}
        >
          <Text style={styles.shaktiButtonText}>Shakti</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerSubtitle}>Develop valuable skills for your journey</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#d94c86" />
          <Text style={styles.loaderText}>Loading lessons...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLessons}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lessons.length > 0 ? lessons : [
            {_id: '1', title: 'Introduction to Public Speaking', skills: ['Communication', 'Confidence'], duration: '25'},
            {_id: '2', title: 'Negotiation Fundamentals', skills: ['Leadership', 'Business'], duration: '30'},
            {_id: '3', title: 'Financial Independence', skills: ['Finance', 'Planning'], duration: '20'},
          ]}
          renderItem={renderLessonItem}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigation.navigate('Home', { token })}
        >
          <View style={styles.tabIcon}>
            <Text style={styles.tabIconText}>🏠</Text>
          </View>
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigation.navigate('Community', { token })}
        >
          <View style={styles.tabIcon}>
            <Text style={styles.tabIconText}>👥</Text>
          </View>
          <Text style={styles.tabText}>Community</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
        >
          <View style={[styles.tabIcon, styles.activeTab]}>
            <Text style={styles.tabIconText}>📚</Text>
          </View>
          <Text style={[styles.tabText, styles.activeTabText]}>Learn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigation.navigate('Profile', { token })}
        >
          <View style={styles.tabIcon}>
            <Text style={styles.tabIconText}>👤</Text>
          </View>
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d94c86',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  shaktiButton: {
    backgroundColor: '#d94c86',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  shaktiButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 90, // Space for tab bar
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d94c86',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#d94c86',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  lessonContent: {
    padding: 15,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    flex: 1,
  },
  durationContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  lessonDuration: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  videoThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#e7f0fd',
    marginBottom: 12,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  skillsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#fde7ef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: {
    fontSize: 12,
    color: '#d94c86',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#d94c86',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 25,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeTab: {
    backgroundColor: '#e7fdec',
  },
  tabIconText: {
    fontSize: 18,
  },
  tabText: {
    fontSize: 12,
    color: '#888888',
  },
  activeTabText: {
    color: '#d94c86',
    fontWeight: '600',
  },
});