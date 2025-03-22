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
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';

export default function MentorsScreen({ route, navigation }) {
  const { token } = route.params;
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingMentor, setRequestingMentor] = useState(null);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://10.45.71.76:5000/api/community/mentors', {
        headers: { 'x-auth-token': token },
      });
      setMentors(response.data);
      setError(null);
    } catch (error) {
      console.error(error.response?.data || error.message);
      setError('Unable to load mentors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const requestMentor = async (mentorId, mentorName) => {
    setRequestingMentor(mentorId);
    try {
      await axios.post(
        'http://10.45.71.76:5000/api/profile/mentor/request',
        { mentorId },
        { headers: { 'x-auth-token': token } }
      );
      Alert.alert(
        "Request Sent",
        `Your request to connect with ${mentorName} has been sent successfully.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert(
        "Request Failed",
        "Unable to send mentor request. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setRequestingMentor(null);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const renderMentorItem = ({ item }) => (
    <View style={styles.mentorCard}>
      <View style={styles.mentorImageContainer}>
        <Image 
          source={{ uri: item.user.avatar || 'https://i.imgur.com/placeholder.png' }} 
          style={styles.mentorImage}
        />
        <View style={styles.experienceTag}>
          <Text style={styles.experienceText}>{item.experience || '5'} yrs exp</Text>
        </View>
      </View>
      
      <View style={styles.mentorContent}>
        <Text style={styles.mentorName}>{item.user.name}</Text>
        <Text style={styles.mentorTitle}>{item.title || 'Professional Mentor'}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Skills & Expertise</Text>
        <View style={styles.skillsContainer}>
          {item.skills && item.skills.map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.mentorBio}>{item.bio || 'Experienced mentor passionate about helping others grow in their professional journey.'}</Text>
        
        <TouchableOpacity 
          style={[styles.requestButton, requestingMentor === item._id && styles.requestingButton]}
          onPress={() => requestMentor(item._id, item.user.name)}
          disabled={requestingMentor === item._id}
        >
          <Text style={styles.requestButtonText}>
            {requestingMentor === item._id ? 'Sending Request...' : 'Request Mentorship'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Mentors</Text>
      <Text style={styles.headerSubtitle}>Connect with experienced professionals</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#d94c86" />
          <Text style={styles.loaderText}>Finding mentors...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMentors}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mentors.length > 0 ? mentors : [
            {_id: '1', user: {name: 'Sarah Johnson', avatar: ''}, skills: ['Leadership', 'Marketing', 'Public Speaking'], title: 'Marketing Director', experience: '8', bio: 'Passionate about helping women break into marketing leadership roles.'},
            {_id: '2', user: {name: 'Maya Patel', avatar: ''}, skills: ['Software Development', 'Career Transitions', 'Tech Industry'], title: 'Senior Software Engineer', experience: '6', bio: 'Helping women transition into tech careers with practical guidance and support.'},
            {_id: '3', user: {name: 'Jessica Wong', avatar: ''}, skills: ['Entrepreneurship', 'Finance', 'Networking'], title: 'Startup Founder', experience: '10', bio: 'Serial entrepreneur with a passion for supporting women-led businesses and startups.'},
          ]}
          renderItem={renderMentorItem}
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
          onPress={() => navigation.navigate('Lessons', { token })}
        >
          <View style={styles.tabIcon}>
            <Text style={styles.tabIconText}>📚</Text>
          </View>
          <Text style={styles.tabText}>Learn</Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d94c86',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
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
  mentorCard: {
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
  mentorImageContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: '#e7f0fd',
  },
  mentorImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e7f0fd',
  },
  experienceTag: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(217, 76, 134, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  experienceText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  mentorContent: {
    padding: 20,
  },
  mentorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  mentorTitle: {
    fontSize: 16,
    color: '#d94c86',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  skillBadge: {
    backgroundColor: '#fde7ef',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    color: '#d94c86',
    fontWeight: '500',
  },
  mentorBio: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
  },
  requestButton: {
    backgroundColor: '#d94c86',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  requestingButton: {
    backgroundColor: '#f8a0bd',
  },
  requestButtonText: {
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
    backgroundColor: '#e7f0fd',
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