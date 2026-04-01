import { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'map' as const,
    title: 'Encontre vagas na rua',
    description: 'Veja vagas reportadas por outros motoristas em tempo real no mapa.',
  },
  {
    icon: 'map-pin' as const,
    title: 'Reporte vagas para a comunidade',
    description: 'Estacionou? Toque em "Estacionei" e ajude outros motoristas.',
  },
  {
    icon: 'check-circle' as const,
    title: 'IA valida a legalidade',
    description: 'Nossa inteligência artificial verifica se a vaga é permitida.',
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlide(index);
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('onboarding_seen', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-blue-500">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {slides.map((slide, index) => (
          <View
            key={index}
            style={{ width }}
            className="flex-1 items-center justify-center px-10"
          >
            <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-8">
              <FontAwesome name={slide.icon} size={44} color="#FFFFFF" />
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-4">
              {slide.title}
            </Text>
            <Text className="text-white/80 text-base text-center leading-6">
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className="items-center pb-16 px-10">
        <View className="flex-row mb-8">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`w-2.5 h-2.5 rounded-full mx-1.5 ${
                index === currentSlide ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </View>

        {currentSlide === slides.length - 1 ? (
          <Pressable
            onPress={handleStart}
            className="bg-white rounded-full px-12 py-4"
          >
            <Text className="text-blue-500 text-lg font-bold">Começar</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              scrollRef.current?.scrollTo({ x: width * (currentSlide + 1), animated: true });
            }}
            className="bg-white/20 rounded-full px-12 py-4"
          >
            <Text className="text-white text-lg font-bold">Próximo</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
