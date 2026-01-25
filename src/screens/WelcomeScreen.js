import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const arrowAnim = useRef(new Animated.Value(0)).current;

  const handleStartPress = () => {
    Animated.sequence([
      Animated.timing(arrowAnim, {
        toValue: 10,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(arrowAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Register');
    });
  };

  const animatedArrowStyle = {
    transform: [{ translateX: arrowAnim }],
  };

  const FeatureCard = ({ icon, title, desc }) => (
    <View style={styles.featureCard}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={24} color={theme.textOnPrimary} />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={isDarkMode ? [theme.gradientStart, theme.gradientEnd] : [theme.primary, theme.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/icon-removebg-preview.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Impact Manager</Text>
            <Text style={styles.tagline}>
              Transformando gestão em impacto social
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <FeatureCard
              icon="people-outline"
              title="Gestão de Membros"
              desc="Organize sua equipe com facilidade"
            />
            <FeatureCard
              icon="heart-outline"
              title="Controle de Doações"
              desc="Transparência em cada contribuição"
            />
            <FeatureCard
              icon="calendar-outline"
              title="Eventos & Ações"
              desc="Planejamento completo de atividades"
            />
          </View>

          <View style={styles.footerSection}>
            <TouchableOpacity
              onPress={handleStartPress}
              style={styles.primaryButton}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Comece agora</Text>
              <Animated.View style={animatedArrowStyle}>
                <Ionicons name="arrow-forward" size={24} color={theme.primary} />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-in-outline"
                size={24}
                color={theme.textOnPrimary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.1)', // Static for transparent effect
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Static for transparent effect
  },
  logo: {
    width: 90,
    height: 90,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textOnPrimary,
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: theme.textOnPrimary,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
  },
  featuresContainer: {
    justifyContent: 'center',
    gap: 16,
    flex: 1,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', // Static for transparent effect
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', // Static for transparent effect
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)', // Static for transparent effect
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textOnPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: theme.textOnPrimary,
  },
  footerSection: {
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.backgroundCard,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: 4.65,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
    marginRight: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)', // Static for transparent effect
    backgroundColor: 'rgba(255,255,255,0.05)', // Static for transparent effect
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textOnPrimary,
  },
});

export default WelcomeScreen;


