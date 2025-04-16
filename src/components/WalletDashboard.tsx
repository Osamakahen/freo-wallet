import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useTransactions } from '../contexts/TransactionContext';
import { formatEther } from 'viem';
import { Button, Card, List, Typography, Space, Statistic, Alert } from 'antd';
import { SendOutlined, SwapOutlined, QrcodeOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { TransactionReceipt } from '../types/wallet';

const { Text } = Typography;

interface WalletDashboardProps {
  onSendClick: () => void;
  onReceiveClick: () => void;
  onSwapClick: () => void;
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({
  onSendClick,
  onReceiveClick,
  onSwapClick,
}) => {
  const { selectedAddress } = useWallet();
  const { transactionHistory, loading: transactionsLoading } = useTransactions();
  const [formattedBalance, setFormattedBalance] = useState<string>('0');
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedAddress) {
      setFormattedBalance(formatEther(selectedAddress));
    }
  }, [selectedAddress]);

  const recentTransactions = transactionHistory.slice(0, 5);

  const quickActions = [
    {
      title: 'Send',
      icon: <SendOutlined />,
      onClick: onSendClick,
    },
    {
      title: 'Receive',
      icon: <QrcodeOutlined />,
      onClick: onReceiveClick,
    },
    {
      title: 'Swap',
      icon: <SwapOutlined />,
      onClick: onSwapClick,
    },
    {
      title: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings'),
    },
  ];

  const renderTransactionItem = (tx: TransactionReceipt) => (
    <List.Item>
      <List.Item.Meta
        title={
          <Space>
            <Text strong>{tx.from === selectedAddress ? 'Sent' : 'Received'}</Text>
            <Text type="secondary">{new Date(tx.timestamp).toLocaleString()}</Text>
          </Space>
        }
        description={
          <Space direction="vertical">
            <Text>To: {tx.to}</Text>
            <Text>Amount: {formatEther(tx.value)} ETH</Text>
            <Text type={tx.status === 'confirmed' ? 'success' : 'warning'}>
              Status: {tx.status}
            </Text>
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Balance Card */}
        <Card>
          <Statistic
            title="Total Balance"
            value={formattedBalance}
            precision={4}
            suffix="ETH"
          />
          <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
            {selectedAddress}
          </Text>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <Space size="large">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                icon={action.icon}
                onClick={action.onClick}
                size="large"
              >
                {action.title}
              </Button>
            ))}
          </Space>
        </Card>

        {/* Recent Transactions */}
        <Card
          title="Recent Transactions"
          extra={
            <Button type="link" onClick={() => navigate('/transactions')}>
              View All
            </Button>
          }
        >
          {transactionsLoading ? (
            <Alert message="Loading transactions..." type="info" showIcon />
          ) : recentTransactions.length > 0 ? (
            <List
              dataSource={recentTransactions}
              renderItem={renderTransactionItem}
            />
          ) : (
            <Alert message="No transactions yet" type="info" showIcon />
          )}
        </Card>
      </Space>
    </div>
  );
};

export default WalletDashboard; 