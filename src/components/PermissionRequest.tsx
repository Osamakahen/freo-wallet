import React, { useState } from 'react';
import Image from 'next/image';
import { SessionPermissions } from '../types/dapp';
import '../styles/PermissionRequest.css';

interface PermissionRequestProps {
  dAppName: string;
  dAppIcon: string;
  requestedPermissions: SessionPermissions;
  onApprove: (permissions: SessionPermissions) => void;
  onReject: () => void;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({
  dAppName,
  dAppIcon,
  requestedPermissions,
  onApprove,
  onReject
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<SessionPermissions>({
    read: requestedPermissions.read,
    write: requestedPermissions.write,
    sign: requestedPermissions.sign,
    nft: requestedPermissions.nft
  });

  const handlePermissionChange = (permission: keyof SessionPermissions) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleApprove = () => {
    onApprove(selectedPermissions);
  };

  return (
    <div className="permission-request">
      <div className="permission-request-header">
        <Image
          src={dAppIcon}
          alt={dAppName}
          width={40}
          height={40}
          className="dapp-icon"
        />
        <h2>{dAppName} is requesting permissions</h2>
      </div>

      <div className="permission-list">
        <h3>Requested Permissions:</h3>
        <div className="permission-item">
          <input
            type="checkbox"
            id="read"
            checked={selectedPermissions.read}
            onChange={() => handlePermissionChange('read')}
          />
          <label htmlFor="read">Read account data</label>
        </div>
        <div className="permission-item">
          <input
            type="checkbox"
            id="write"
            checked={selectedPermissions.write}
            onChange={() => handlePermissionChange('write')}
          />
          <label htmlFor="write">Send transactions</label>
        </div>
        <div className="permission-item">
          <input
            type="checkbox"
            id="sign"
            checked={selectedPermissions.sign}
            onChange={() => handlePermissionChange('sign')}
          />
          <label htmlFor="sign">Sign messages</label>
        </div>
        <div className="permission-item">
          <input
            type="checkbox"
            id="nft"
            checked={selectedPermissions.nft}
            onChange={() => handlePermissionChange('nft')}
          />
          <label htmlFor="nft">Access NFTs</label>
        </div>
      </div>

      <div className="permission-actions">
        <button onClick={onReject} className="reject-button">
          Reject
        </button>
        <button onClick={handleApprove} className="approve-button">
          Approve
        </button>
      </div>
    </div>
  );
}; 