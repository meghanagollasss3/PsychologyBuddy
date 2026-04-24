# Single Sign-On (SSO) Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing Single Sign-On (SSO) functionality in the Psychology Buddy application. The application currently uses a custom authentication system with JWT tokens and Google OAuth integration. This guide will help you extend it to support enterprise SSO solutions.

## Current Authentication Architecture

### Existing Components
- **JWT-based authentication** with refresh tokens
- **Google OAuth 2.0** integration
- **Role-based access control** (Admin, Counselor, Teacher, Student)
- **Session management** with NextAuth.js
- **Custom middleware** for API authentication

### Key Files
- `src/lib/auth.ts` - Core authentication utilities
- `src/server/auth/auth-middleware.ts` - Authentication middleware
- `app/api/auth/` - Authentication API endpoints
- `.env` - Environment configuration

## SSO Implementation Options

### 1. SAML 2.0 Integration
**Best for:** Enterprise environments with Active Directory, ADFS, or other SAML identity providers

**Providers:**
- Microsoft Azure AD
- Okta
- Auth0
- OneLogin
- JumpCloud

### 2. OpenID Connect (OIDC)
**Best for:** Modern identity providers and cloud services

**Providers:**
- Google Workspace
- Microsoft Azure AD
- Auth0
- Keycloak
- Firebase Authentication

### 3. LDAP Integration
**Best for:** On-premise directory services

**Providers:**
- Active Directory
- OpenLDAP
- FreeIPA

## Implementation Strategy

### Phase 1: Choose SSO Protocol

#### Option A: SAML 2.0 (Recommended for Enterprise)
```bash
npm install @node-saml/passport-saml @types/passport-saml
```

#### Option B: OIDC (Recommended for Cloud Services)
```bash
npm install openid-client passport-openidconnect @types/passport-openidconnect
```

#### Option C: LDAP (For On-Premise)
```bash
npm install ldapjs passport-ldapauth @types/passport-ldapauth
```

### Phase 2: Database Schema Updates

Add SSO configuration to your database schema:

```sql
-- Add SSO provider configuration
CREATE TABLE SSOProviders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'saml', 'oidc', 'ldap'
    config JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    schoolId INTEGER REFERENCES Schools(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add SSO user mappings
CREATE TABLE SSOUserMappings (
    id SERIAL PRIMARY KEY,
    userId INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    providerId INTEGER REFERENCES SSOProviders(id) ON DELETE CASCADE,
    externalId VARCHAR(255) NOT NULL,
    externalEmail VARCHAR(255),
    metadata JSONB,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(providerId, externalId)
);

-- Update Users table for SSO
ALTER TABLE Users ADD COLUMN ssoProviderId INTEGER REFERENCES SSOProviders(id);
ALTER TABLE Users ADD COLUMN isSSOUser BOOLEAN DEFAULT false;
```

### Phase 3: Environment Configuration

Add SSO configuration to `.env`:

```env
# SSO Configuration
SSO_ENABLED=true
SSO_DEFAULT_PROVIDER=saml

# SAML Configuration
SAML_ENTRY_POINT=https://your-idp.com/saml/sso
SAML_ISSUER=psychology-buddy
SAML_CERT_PATH=./certs/saml-cert.pem
SAML_KEY_PATH=./certs/saml-key.pem

# OIDC Configuration
OIDC_ISSUER=https://your-provider.com/.well-known/openid-configuration
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/api/auth/callback/oidc

# LDAP Configuration
LDAP_URL=ldap://your-ldap-server:389
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=your-password
LDAP_SEARCH_BASE=ou=users,dc=example,dc=com
LDAP_SEARCH_FILTER=(uid={{username}})
```

## Implementation Steps

### Step 1: Create SSO Service Layer

Create `src/server/services/sso.service.ts`:

```typescript
import { SSOProvider, SSOUserMapping } from '@prisma/client';
import { AuthError } from '@/src/utils/errors';

export interface SSOConfig {
  type: 'saml' | 'oidc' | 'ldap';
  config: Record<string, any>;
}

export interface SSOUserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  schoolId?: string;
  metadata?: Record<string, any>;
}

export class SSOService {
  /**
   * Authenticate user via SSO provider
   */
  static async authenticate(providerId: string, ssoResponse: any): Promise<SSOUserProfile> {
    const provider = await this.getProvider(providerId);
    if (!provider || !provider.enabled) {
      throw new AuthError('SSO provider not found or disabled');
    }

    switch (provider.type) {
      case 'saml':
        return this.handleSAMLAuth(provider, ssoResponse);
      case 'oidc':
        return this.handleOIDCAuth(provider, ssoResponse);
      case 'ldap':
        return this.handleLDAPAuth(provider, ssoResponse);
      default:
        throw new AuthError('Unsupported SSO provider type');
    }
  }

  /**
   * Create or update user from SSO profile
   */
  static async createOrUpdateUser(profile: SSOUserProfile, providerId: string) {
    // Check if user already exists with this SSO mapping
    const existingMapping = await prisma.sSOUserMapping.findFirst({
      where: {
        providerId,
        externalId: profile.id
      },
      include: {
        user: true
      }
    });

    if (existingMapping) {
      // Update existing user
      return await prisma.user.update({
        where: { id: existingMapping.userId },
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          lastLogin: new Date()
        }
      });
    }

    // Check if user exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email: profile.email }
    });

    if (existingUser) {
      // Link existing user to SSO provider
      await prisma.sSOUserMapping.create({
        data: {
          userId: existingUser.id,
          providerId,
          externalId: profile.id,
          externalEmail: profile.email,
          metadata: profile.metadata
        }
      });

      return await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          ssoProviderId: providerId,
          isSSOUser: true,
          lastLogin: new Date()
        }
      });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: profile.email,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        ssoProviderId: providerId,
        isSSOUser: true,
        roleId: await this.getDefaultRoleId(),
        schoolId: profile.schoolId ? parseInt(profile.schoolId) : null,
        lastLogin: new Date()
      }
    });

    // Create SSO mapping
    await prisma.sSOUserMapping.create({
      data: {
        userId: user.id,
        providerId,
        externalId: profile.id,
        externalEmail: profile.email,
        metadata: profile.metadata
      }
    });

    return user;
  }

  private static async handleSAMLAuth(provider: SSOProvider, ssoResponse: any): Promise<SSOUserProfile> {
    // Implement SAML response parsing
    // Use passport-saml or similar library
    throw new Error('SAML authentication not implemented yet');
  }

  private static async handleOIDCAuth(provider: SSOProvider, tokenSet: any): Promise<SSOUserProfile> {
    // Implement OIDC token verification
    // Use openid-client library
    throw new Error('OIDC authentication not implemented yet');
  }

  private static async handleLDAPAuth(provider: SSOProvider, credentials: any): Promise<SSOUserProfile> {
    // Implement LDAP authentication
    // Use ldapjs library
    throw new Error('LDAP authentication not implemented yet');
  }

  private static async getProvider(providerId: string) {
    return await prisma.sSOProvider.findUnique({
      where: { id: providerId }
    });
  }

  private static async getDefaultRoleId() {
    // Return default student role or based on SSO profile
    const studentRole = await prisma.role.findFirst({
      where: { name: 'Student' }
    });
    return studentRole?.id;
  }
}
```

### Step 2: Create SSO API Endpoints

Create `app/api/auth/sso/[provider]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { SSOService } from '@/src/server/services/sso.service';

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const { provider } = params;

  try {
    // Initiate SSO flow
    const authUrl = await SSOService.getAuthUrl(provider);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      { error: 'SSO authentication failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  const { provider } = params;
  const body = await request.json();

  try {
    // Handle SSO callback
    const profile = await SSOService.authenticate(provider, body);
    const user = await SSOService.createOrUpdateUser(profile, provider);
    
    // Create JWT tokens
    const tokens = await createAuthTokens(user);
    
    return NextResponse.json({
      user,
      tokens
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'SSO authentication failed' },
      { status: 401 }
    );
  }
}
```

### Step 3: Update Authentication Middleware

Update `src/server/auth/auth-middleware.ts`:

```typescript
export class AuthMiddleware {
  static async authenticate(request: Request) {
    // Check for Bearer token first
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');
    
    if (token) {
      // JWT authentication (existing logic)
      return await this.authenticateWithJWT(token);
    }
    
    // Check for SSO session
    const ssoToken = request.headers.get('x-sso-token');
    if (ssoToken) {
      return await this.authenticateWithSSO(ssoToken);
    }
    
    throw new AppError('Authentication required', 401);
  }

  private static async authenticateWithJWT(token: string) {
    // Existing JWT authentication logic
    // ... (keep existing implementation)
  }

  private static async authenticateWithSSO(token: string) {
    try {
      // Verify SSO token and get user
      const payload = jwt.verify(token, process.env.JWT_SECRET!);
      const user = await DatabaseService.getUserById(payload.userId);
      
      if (!user || !user.isSSOUser) {
        throw new AppError('Invalid SSO token', 401);
      }
      
      return user;
    } catch (error) {
      throw new AppError('SSO authentication failed', 401);
    }
  }
}
```

### Step 4: Create SSO Configuration UI

Create `components/admin/sso/SSOConfiguration.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oidc' | 'ldap';
  enabled: boolean;
  config: Record<string, any>;
}

export default function SSOConfiguration() {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/sso/providers');
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Failed to fetch SSO providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProvider = async (providerId: string, updates: Partial<SSOProvider>) => {
    try {
      const response = await fetch(`/api/admin/sso/providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        await fetchProviders();
      }
    } catch (error) {
      console.error('Failed to update provider:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SSO Configuration</h1>
      
      {providers.map((provider) => (
        <Card key={provider.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {provider.name}
              <Switch
                checked={provider.enabled}
                onCheckedChange={(enabled) => 
                  updateProvider(provider.id, { enabled })
                }
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Provider Type</label>
                <p className="text-sm text-gray-600">{provider.type.toUpperCase()}</p>
              </div>
              
              {/* Configuration fields based on provider type */}
              {provider.type === 'saml' && (
                <div className="space-y-2">
                  <Input
                    placeholder="SAML Entry Point"
                    defaultValue={provider.config.entryPoint}
                    onChange={(e) => updateProvider(provider.id, {
                      config: { ...provider.config, entryPoint: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="Issuer"
                    defaultValue={provider.config.issuer}
                    onChange={(e) => updateProvider(provider.id, {
                      config: { ...provider.config, issuer: e.target.value }
                    })}
                  />
                </div>
              )}
              
              {provider.type === 'oidc' && (
                <div className="space-y-2">
                  <Input
                    placeholder="OIDC Issuer"
                    defaultValue={provider.config.issuer}
                    onChange={(e) => updateProvider(provider.id, {
                      config: { ...provider.config, issuer: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="Client ID"
                    defaultValue={provider.config.clientId}
                    onChange={(e) => updateProvider(provider.id, {
                      config: { ...provider.config, clientId: e.target.value }
                    })}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Provider-Specific Implementations

### 1. SAML 2.0 Implementation

Install dependencies:
```bash
npm install @node-saml/passport-saml xml2js @types/xml2js
```

Create `src/server/sso/saml-provider.ts`:

```typescript
import { Strategy as SamlStrategy } from '@node-saml/passport-saml';
import { SSOUserProfile } from '../services/sso.service';

export class SAMLProvider {
  private strategy: SamlStrategy;

  constructor(config: any) {
    this.strategy = new SamlStrategy(
      {
        entryPoint: config.entryPoint,
        issuer: config.issuer,
        cert: config.cert,
        callbackUrl: config.callbackUrl
      },
      async (profile: any, done: any) => {
        try {
          const userProfile: SSOUserProfile = {
            id: profile.nameID,
            email: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
            firstName: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
            lastName: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
            metadata: profile
          };
          
          done(null, userProfile);
        } catch (error) {
          done(error);
        }
      }
    );
  }

  getStrategy() {
    return this.strategy;
  }
}
```

### 2. OIDC Implementation

Install dependencies:
```bash
npm install openid-client jose
```

Create `src/server/sso/oidc-provider.ts`:

```typescript
import { Client } from 'openid-client';
import { SSOUserProfile } from '../services/sso.service';

export class OIDCProvider {
  private client: Client;

  constructor(config: any) {
    this.initializeClient(config);
  }

  private async initializeClient(config: any) {
    const issuer = await Client.discover(config.issuer);
    this.client = new Client(issuer, {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uris: [config.redirectUri]
    });
  }

  async getAuthUrl(): Promise<string> {
    return this.client.authorizationUrl({
      scope: 'openid email profile',
      response_mode: 'query'
    });
  }

  async handleCallback(code: string): Promise<SSOUserProfile> {
    const tokenSet = await this.client.callback(
      this.client.metadata.redirect_uris![0],
      { code }
    );

    const userInfo = await this.client.userinfo(tokenSet.access_token!);

    return {
      id: userInfo.sub,
      email: userInfo.email!,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      metadata: {
        tokenSet,
        userInfo
      }
    };
  }
}
```

### 3. LDAP Implementation

Install dependencies:
```bash
npm install ldapjs @types/ldapjs
```

Create `src/server/sso/ldap-provider.ts`:

```typescript
import * as ldap from 'ldapjs';
import { SSOUserProfile } from '../services/sso.service';

export class LDAPProvider {
  private client: ldap.Client;
  private config: any;

  constructor(config: any) {
    this.config = config;
    this.client = ldap.createClient({
      url: config.url
    });
  }

  async authenticate(username: string, password: string): Promise<SSOUserProfile> {
    return new Promise((resolve, reject) => {
      // Bind with admin credentials
      this.client.bind(this.config.bindDN, this.config.bindPassword, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for user
        const searchOptions = {
          filter: this.config.searchFilter.replace('{{username}}', username),
          scope: 'sub',
          attributes: ['uid', 'mail', 'givenName', 'sn', 'cn']
        };

        this.client.search(this.config.searchBase, searchOptions, (searchErr, searchRes) => {
          if (searchErr) {
            reject(searchErr);
            return;
          }

          let userFound = false;
          searchRes.on('searchEntry', (entry) => {
            userFound = true;
            const userDN = entry.objectName;
            const attributes = entry.object;

            // Verify user credentials
            this.client.bind(userDN, password, (bindErr) => {
              if (bindErr) {
                reject(new Error('Invalid credentials'));
                return;
              }

              const profile: SSOUserProfile = {
                id: attributes.uid,
                email: attributes.mail,
                firstName: attributes.givenName,
                lastName: attributes.sn,
                metadata: attributes
              };

              resolve(profile);
            });
          });

          searchRes.on('end', () => {
            if (!userFound) {
              reject(new Error('User not found'));
            }
          });

          searchRes.on('error', (searchErr) => {
            reject(searchErr);
          });
        });
      });
    });
  }
}
```

## Testing Strategy

### 1. Unit Tests

Create `src/test/sso.test.ts`:

```typescript
import { SSOService } from '../server/services/sso.service';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('SSO Service', () => {
  beforeEach(() => {
    // Mock database and external services
  });

  it('should authenticate SAML user', async () => {
    const mockSAMLResponse = {
      nameID: 'test-user',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'test@example.com'
    };

    const profile = await SSOService.authenticate('saml-provider', mockSAMLResponse);
    expect(profile.email).toBe('test@example.com');
  });

  it('should create new user from SSO profile', async () => {
    const profile = {
      id: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = await SSOService.createOrUpdateUser(profile, 'saml-provider');
    expect(user.email).toBe('test@example.com');
    expect(user.isSSOUser).toBe(true);
  });
});
```

### 2. Integration Tests

Create test scripts for each provider:

```bash
# Test SAML integration
npm run test:saml

# Test OIDC integration
npm run test:oidc

# Test LDAP integration
npm run test:ldap
```

## Security Considerations

### 1. Certificate Management
- Store SAML certificates securely
- Implement certificate rotation
- Use environment variables for sensitive data

### 2. Token Security
- Use short-lived SSO tokens
- Implement proper token refresh
- Secure token storage

### 3. Network Security
- Use HTTPS for all SSO communications
- Validate SAML signatures
- Implement replay attack protection

### 4. Data Protection
- Hash and salt any stored credentials
- Implement proper audit logging
- Follow GDPR and data protection regulations

## Deployment Checklist

### Pre-Deployment
- [ ] Configure SSO providers in production
- [ ] Set up SSL certificates
- [ ] Test all SSO flows
- [ ] Verify user provisioning
- [ ] Test error handling

### Post-Deployment
- [ ] Monitor SSO authentication logs
- [ ] Test user login flows
- [ ] Verify role mapping
- [ ] Check performance impact
- [ ] Update documentation

## Troubleshooting

### Common Issues

1. **SAML Signature Validation Failed**
   - Check certificate configuration
   - Verify certificate format (PEM)
   - Ensure clocks are synchronized

2. **OIDC Redirect URI Mismatch**
   - Verify redirect URI configuration
   - Check for trailing slashes
   - Ensure HTTPS in production

3. **LDAP Connection Refused**
   - Verify LDAP server connectivity
   - Check bind credentials
   - Validate search base DN

4. **User Not Found**
   - Check user attribute mapping
   - Verify search filters
   - Ensure user exists in identity provider

### Debug Mode

Enable debug logging:
```env
SSO_DEBUG=true
NODE_ENV=development
```

## Maintenance

### Regular Tasks
- Monitor SSO provider status
- Rotate certificates annually
- Review user access logs
- Update provider configurations

### Scaling Considerations
- Implement caching for SSO responses
- Use load balancers for high availability
- Monitor authentication performance
- Plan for provider failover

## Support

For issues with SSO implementation:
1. Check provider documentation
2. Review authentication logs
3. Test with provider's test tools
4. Contact provider support if needed

---

## Next Steps

1. Choose your SSO protocol (SAML, OIDC, or LDAP)
2. Install required dependencies
3. Update database schema
4. Configure environment variables
5. Implement provider-specific code
6. Test thoroughly
7. Deploy to production
8. Monitor and maintain

This guide provides a comprehensive foundation for implementing SSO in Psychology Buddy. Adjust the implementation based on your specific requirements and chosen identity provider.
