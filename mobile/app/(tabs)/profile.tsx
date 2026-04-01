import { Text, View } from 'react-native';
import { useDeviceStore } from '@/stores/device-store';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { COLORS } from '@/constants/config';

export default function ProfileScreen() {
  const deviceId = useDeviceStore((s) => s.deviceId);
  const truncatedId = deviceId ? `${deviceId.slice(0, 12)}...` : '---';

  return (
    <View className="flex-1 bg-slate-50 pt-16 px-5">
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-3">
          <FontAwesome name="user" size={36} color={COLORS.primary} />
        </View>
        <Text className="text-xl font-bold text-gray-900">Meu Perfil</Text>
      </View>

      <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
        <Text className="text-sm text-gray-500 mb-1">Device ID</Text>
        <Text className="text-base font-mono text-gray-900 mb-4">{truncatedId}</Text>

        <Text className="text-sm text-gray-500 mb-2">Reputação</Text>
        <View className="h-3 bg-gray-200 rounded-full overflow-hidden mb-1">
          <View
            className="h-full bg-blue-500 rounded-full"
            style={{ width: '50%' }}
          />
        </View>
        <Text className="text-xs text-gray-500 text-right">50/100</Text>
      </View>

      <View className="bg-white rounded-2xl p-5 shadow-sm">
        <Text className="text-lg font-bold text-gray-900 mb-4">Estatísticas</Text>

        <View className="flex-row justify-between mb-3">
          <Text className="text-gray-500">Vagas reportadas</Text>
          <Text className="text-gray-900 font-bold">--</Text>
        </View>

        <View className="h-px bg-gray-100" />

        <View className="flex-row justify-between mt-3">
          <Text className="text-gray-500">Vagas aprovadas</Text>
          <Text className="text-gray-900 font-bold">--</Text>
        </View>
      </View>
    </View>
  );
}
