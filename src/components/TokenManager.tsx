import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { TokenManager as TokenManagerCore } from '../core/token/TokenManager';
import { Card, Table, Button, Space, Typography, Input, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { formatEther } from 'viem';
import { EVMAdapter } from '../core/evm/EVMAdapter';
import { mainnet } from 'viem/chains';
import debounce from 'lodash/debounce';
import { TokenInfo } from '../types/token';

const { Title, Text } = Typography;
const { Search } = Input;

interface Token extends TokenInfo {
  balance: bigint;
}

const TokenManager: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isAddTokenModalVisible, setIsAddTokenModalVisible] = useState(false);
  const [addTokenLoading, setAddTokenLoading] = useState(false);
  const [form] = Form.useForm();

  // Initialize tokenManager with current chain
  const [tokenManager] = useState(() => new TokenManagerCore(new EVMAdapter(mainnet)));

  const loadTokens = useCallback(async () => {
    if (!address || !isConnected) return;
    
    setLoading(true);
    try {
      const tokenAddresses = await tokenManager.getTokenList();
      const tokenBalances = await Promise.all(
        tokenAddresses.map(async (tokenAddress) => {
          const info = await tokenManager.getTokenInfo(tokenAddress);
          const balance = await tokenManager.getBalance(tokenAddress, address as `0x${string}`);
          return {
            ...info,
            balance
          };
        })
      );

      // Ensure token addresses are unique
      const uniqueTokens = Array.from(
        new Map(tokenBalances.map(token => [token.address, token])).values()
      );
      setTokens(uniqueTokens);
    } catch (error) {
      console.error('Error loading tokens:', error);
      message.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, tokenManager]);

  useEffect(() => {
    if (address && isConnected) {
      loadTokens();
    }
  }, [address, isConnected, loadTokens]);

  const handleAddToken = async (values: { address: string }) => {
    setAddTokenLoading(true);
    try {
      const tokenAddress = values.address as `0x${string}`;
      const tokenInfo = await tokenManager.getTokenInfo(tokenAddress);
      const balance = await tokenManager.getBalance(tokenAddress, address as `0x${string}`);
      
      setTokens(prev => {
        const newTokens = [...prev];
        const existingIndex = newTokens.findIndex(t => t.address === tokenAddress);
        const newToken = { ...tokenInfo, balance };
        
        if (existingIndex >= 0) {
          newTokens[existingIndex] = newToken;
        } else {
          newTokens.push(newToken);
        }
        
        return newTokens;
      });

      message.success('Token added successfully');
      setIsAddTokenModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error adding token:', error);
      message.error('Failed to add token');
    } finally {
      setAddTokenLoading(false);
    }
  };

  const handleRemoveToken = async (tokenAddress: string) => {
    try {
      setTokens(prev => prev.filter(token => token.address !== tokenAddress));
      message.success('Token removed successfully');
    } catch (error) {
      console.error('Error removing token:', error);
      message.error('Failed to remove token');
    }
  };

  // Memoize filtered tokens for performance
  const filteredTokens = useMemo(() => 
    tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(searchText.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchText.toLowerCase())
    ),
    [tokens, searchText]
  );

  // Debounce search input
  const debouncedSetSearchText = useMemo(
    () => debounce((value: string) => setSearchText(value), 300),
    []
  );

  const columns = [
    {
      title: 'Token',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string, record: Token) => (
        <Space>
          <Text strong>{symbol}</Text>
          <Text type="secondary">{record.name}</Text>
        </Space>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: bigint, record: Token) => (
        <Text>
          {balance ? formatEther(balance) : '0.0'} {record.symbol}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Token) => (
        <Button
          type="link"
          danger
          onClick={() => handleRemoveToken(record.address)}
        >
          Remove
        </Button>
      ),
    },
  ];

  if (!address || !isConnected) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Text type="secondary">Connect a wallet to view tokens</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={2}>Tokens</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddTokenModalVisible(true)}
            >
              Add Token
            </Button>
          </Space>

          <Search
            placeholder="Search tokens"
            allowClear
            enterButton={<SearchOutlined />}
            onChange={(e) => debouncedSetSearchText(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          <Table
            columns={columns}
            dataSource={filteredTokens}
            loading={loading}
            rowKey="address"
            locale={{ emptyText: 'No tokens found' }}
          />
        </Card>
      </Space>

      <Modal
        title="Add Token"
        open={isAddTokenModalVisible}
        onCancel={() => setIsAddTokenModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddToken}>
          <Form.Item
            name="address"
            label="Token Address"
            rules={[
              { required: true, message: 'Please input the token address' },
              {
                pattern: /^0x[a-fA-F0-9]{40}$/,
                message: 'Please enter a valid Ethereum address',
              },
            ]}
          >
            <Input placeholder="0x..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={addTokenLoading}>
                Add
              </Button>
              <Button onClick={() => setIsAddTokenModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TokenManager; 