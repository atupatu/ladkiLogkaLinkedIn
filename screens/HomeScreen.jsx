import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Image,
  ScrollView
} from 'react-native';
import { Linking } from 'react-native'; // Add this import

export default function HomeScreen({ route, navigation }) {
  const { token } = route.params;

  const navigateTo = (screen) => {
    navigation.navigate(screen, { token });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome to</Text>
        <Text style={styles.appName}>EMPOWER</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>How would you like to grow today?</Text>
        <Text style={styles.sectionSubtitle}>
          Elevate your future—refresh your skills with our latest tools and lessons!
        </Text>
        
        <View style={styles.cardContainer}>
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateTo('Community')}
          >
            <View style={[styles.cardIcon, styles.communityIcon]}>
              <Image 
                source={require('../assets/community-icon.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.cardTitle}>Community</Text>
            <Text style={styles.cardDescription}>
              Connect with other women, share experiences and support each other
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateTo('Mentors')}
          >
            <View style={[styles.cardIcon, styles.mentorsIcon]}>
              <Image 
                source={require('../assets/mentor-icon.png')} 
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.cardTitle}>Mentors</Text>
            <Text style={styles.cardDescription}>
              Find guidance from experienced mentors in your field of interest
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateTo('Lessons')}
          >
            <View style={[styles.cardIcon, styles.lessonsIcon]}>
              <Image 
                source={require('../assets/lessons.png')} 
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.cardTitle}>Lessons</Text>
            <Text style={styles.cardDescription}>
              Boost your expertise with cutting-edge courses tailored for you
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateTo('Profile')}
          >
            <View style={[styles.cardIcon, styles.profileIcon]}>
              <Image 
                source={require('../assets/profile-icon.png')} 
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.cardTitle}>Profile</Text>
            <Text style={styles.cardDescription}>
              Manage your personal information and track your progress
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.featuredSection}>
          <Text style={styles.featuredTitle}>Featured Story</Text>
          <View style={styles.featuredCard}>
            <Image 
              source={require('../assets/techjourney.png')}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.featuredContent}>
              <Text style={styles.featuredHeadline}>
                "How I Started My Tech Journey"
              </Text>
              <Text style={styles.featuredAuthor}>
                By Sarah Johnson
              </Text>
              <TouchableOpacity style={styles.readMoreButton}>
                <Text style={styles.readMoreText}>Read More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.upcomingSection}>
          <Text style={styles.upcomingTitle}>Upcoming Events</Text>
          <TouchableOpacity 
            style={styles.eventCard} 
            onPress={() => Linking.openURL('https://meet.google.com/frx-msiv-pxc')} // Replace with your meet link
          >
            <View style={styles.eventDateBox}>
              <Text style={styles.eventMonth}>APR</Text>
              <Text style={styles.eventDay}>15</Text>
            </View>
            <View style={styles.eventDetails}>
              <Text style={styles.eventName}>Women in Leadership Workshop</Text>
              <Text style={styles.eventLocation}>Virtual • 2:00 PM - 4:00 PM</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => {}} // Home is current screen
        >
          <View style={[styles.tabIcon, styles.activeTab]}>
            <Text style={styles.tabIconText}>🏠</Text>
          </View>
          <Text style={[styles.tabText, styles.activeTabText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigateTo('Community')}
        >
          <View style={styles.tabIcon}>
            <Text style={styles.tabIconText}>👥</Text>
          </View>
          <Text style={styles.tabText}>Community</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigateTo('Lessons')}
        >
          <View style={styles.tabIcon}>
            <Text style={styles.tabIconText}>📚</Text>
          </View>
          <Text style={styles.tabText}>Learn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigateTo('Profile')}
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
    alignItems: 'center',
  },
  welcome: {
    fontSize: 16,
    color: '#666666',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d94c86',
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 90, // Extra space for the tab bar
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#d94c86',
    marginHorizontal: 20,
    marginBottom: 15,
    fontWeight: '500',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 5,
    marginBottom: 15,
    width: '46%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  communityIcon: {
    backgroundColor: '#fde7ef',
  },
  mentorsIcon: {
    backgroundColor: '#e7f0fd',
  },
  lessonsIcon: {
    backgroundColor: '#e7fdec',
  },
  profileIcon: {
    backgroundColor: '#f7e7fd',
  },
  iconImage: {
    width: 30,
    height: 30,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18,
  },
  featuredSection: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
  },
  featuredCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  featuredImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f1f1f1',
  },
  featuredContent: {
    padding: 15,
  },
  featuredHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  featuredAuthor: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 15,
  },
  readMoreButton: {
    backgroundColor: '#d94c86',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingSection: {
    marginTop: 5,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    flexDirection: 'row',
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
  eventDateBox: {
    backgroundColor: '#d94c86',
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventMonth: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventDay: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  eventDetails: {
    padding: 15,
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: '#888888',
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
    backgroundColor: '#fde7ef',
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