import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Select, Space, Typography } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const networks = [
  {
    id: 1,
    name: 'Ethereum Mainnet',
    icon: '🌐',
  },
  {
    id: 5,
    name: 'Goerli Testnet',
    icon: '🔬',
  },
  {
    id: 11155111,
    name: 'Sepolia Testnet',
    icon: '🧪',
  },
  {
    id: 137,
    name: 'Polygon Mainnet',
    icon: '🔷',
  },
  {
    id: 80001,
    name: 'Mumbai Testnet',
    icon: '🔹',
  },
];

const NetworkSelector: React.FC = () => {
  const { chainId, setChainId } = useWallet();

  const handleNetworkChange = (newChainId: number) => {
    setChainId(newChainId.toString());
  };

  const currentChainId = chainId ? parseInt(chainId) : undefined;

  return (
    <Space>
      <GlobalOutlined />
      <Select
        value={currentChainId}
        onChange={handleNetworkChange}
        style={{ width: 200 }}
      >
        {networks.map((network) => (
          <Option key={network.id} value={network.id}>
            <Space>
              <Text>{network.icon}</Text>
              <Text>{network.name}</Text>
            </Space>
          </Option>
        ))}
      </Select>
    </Space>
  );
};

export default NetworkSelector; 