'use client';

import { useState, useEffect } from 'react';
import { Package, PlusCircle, CheckCircle2 } from 'lucide-react';

// 백엔드 API에서 던져주는 Trait 포맷
type Trait = {
  layerName: string;
  zIndex: number;
  partName: string;
  imageUrl: string;
};

// API 응답 전체
type GenerateResponse = {
  success: boolean;
  coinHash: string;
  collectionName: string;
  traits: Trait[];
  error?: string;
};

// 프론트엔드 인벤토리(지갑)에 저장될 아이템 형태
type InventoryItem = {
  id: string;
  timestamp: string; // 뽑은 시간
  hash: string;
  collectionName: string;
  traits: Trait[];
};

export default function StandaloneTestCoinPage() {
  const [apiUrl, setApiUrl] = useState('https://rulemaker.vercel.app/api/generate-coin');
  const [collectionId, setCollectionId] = useState('');
  const [userId, setUserId] = useState(`test_user_${Date.now()}`);

  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // 방금 뽑은 코인 모달창 띄우기용
  const [newCoin, setNewCoin] = useState<InventoryItem | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [fetchingCollections, setFetchingCollections] = useState(false);

  // apiUrl이 변경될 때 해당 서버에서 컬렉션 리스트를 가져옵니다.
  useEffect(() => {
    async function fetchCollections() {
      try {
        if (!apiUrl.startsWith('http')) return;
        setFetchingCollections(true);
        const urlObj = new URL(apiUrl);
        const baseUrl = urlObj.origin;
        const res = await fetch(`${baseUrl}/api/collections`);

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(
            'Invalid JSON response format. The target server might not have the /api/collections endpoint.',
          );
        }

        if (data.success && data.collections) {
          setCollections(data.collections);
          // 컬렉션 리스트가 있고, 현재 선택된 컬렉션 ID가 리스트에 없으면 첫 번째 항목으로 설정
          if (
            data.collections.length > 0 &&
            !data.collections.find((c: any) => c.id == collectionId)
          ) {
            setCollectionId(data.collections[0].id.toString());
          }
        } else {
          setCollections([]);
        }
      } catch (err) {
        console.error('Failed to fetch collections', err);
        setCollections([]);
      } finally {
        setFetchingCollections(false);
      }
    }

    // 사용자가 타이핑하는 동안 너무 잦은 API 호출을 막기 위해 약간 지연
    const timer = setTimeout(() => {
      fetchCollections();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const handleGenerate = async () => {
    if (!apiUrl) return alert('API URL을 입력해주세요.');
    if (!collectionId) return alert('Collection ID를 입력해주세요.');
    if (!userId) return alert('User ID를 입력해주세요.');

    setLoading(true);
    setErrorMsg('');
    try {
      // 외부 서버에서 API 요청을 보낸다고 가정
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          collectionId: collectionId,
        }),
      });

      const data = (await res.json()) as GenerateResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'API 요청 실패');
      }

      // 응답받은 데이터 처리
      const newItem: InventoryItem = {
        id: data.coinHash,
        timestamp: new Date().toLocaleString(),
        hash: data.coinHash,
        collectionName: data.collectionName,
        traits: data.traits,
      };

      // 모달 팝업으로 즉시 띄우기
      setNewCoin(newItem);

      // 다음 테스트를 위해 userId 갱신
      setUserId(`test_user_${Date.now()}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 모달 확인 버튼
  const handleConfirmNewCoin = () => {
    if (newCoin) {
      // 아이템 지갑(inventory)에 저장 후 모달 닫기
      setInventory((prev) => [newCoin, ...prev]);
      setNewCoin(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-zinc-900 dark:text-zinc-50">
            독립형 API 테스트 페이퍼
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            이 파일(`app/testcoin/page.tsx`) 하나만 복사해서 다른 Next.js 프로젝트에 붙여넣으면,
            어디서든 코인메이커 API 연동 테스트를 진행할 수 있습니다.
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {/* 1. 요청 폼 (쇼룸 컨트롤러) */}
          <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  Target API URL
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://rulemaker.vercel.app/api/generate-coin"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setApiUrl('http://localhost:3000/api/generate-coin')}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    로컬 환경 (localhost:3000)
                  </button>
                  <button
                    onClick={() => setApiUrl('https://rulemaker.vercel.app/api/generate-coin')}
                    className="px-3 py-1.5 text-xs font-semibold bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                  >
                    운영 서버 (vercel)
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Collection List</span>
                  {fetchingCollections && (
                    <span className="text-xs text-blue-500 font-normal animate-pulse">
                      불러오는 중...
                    </span>
                  )}
                </label>
                {collections.length > 0 ? (
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="" disabled>
                      컬렉션을 선택하세요 (드롭다운)
                    </option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    placeholder="API 서버에서 리스트를 찾을 수 없습니다 (ID 직접 입력)"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
                실패: {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                API 무상태 호출
              </label>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full h-[46px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? (
                  'API Request 중...'
                ) : (
                  <>
                    <PlusCircle size={18} /> 코인 생성(가챠) 요청
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. 아이템 지갑 (인벤토리) 영역 */}
          <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm min-h-[400px]">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-zinc-800 dark:text-zinc-100">
              <Package className="text-blue-500" />내 아이템 보관소 ({inventory.length}개)
            </h2>

            {inventory.length === 0 ? (
              <div className="h-64 flex flex-col justify-center items-center text-zinc-400 border-2 border-dashed rounded-xl">
                <Package size={48} className="mb-4 opacity-30" />
                <p className="font-medium text-sm">보유 중인 코인이 없습니다.</p>
                <p className="text-xs mt-1">위에서 설정을 입력하고 코인을 뽑아보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {inventory.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-xl border overflow-hidden hover:shadow-lg transition-all group"
                  >
                    {/* 렌더링 캔버스 영역 */}
                    <div
                      className="relative w-full aspect-square bg-white dark:bg-zinc-950 border-b overflow-hidden"
                      style={{
                        backgroundImage:
                          'linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee)',
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 8px 8px',
                      }}
                    >
                      {/* JSON의 Traits Z-Index 배열 기반으로 프론트엔드 오버레이 처리 */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {item.traits.map((t, i) => (
                        <img
                          key={i}
                          src={t.imageUrl}
                          style={{ zIndex: t.zIndex }}
                          className="absolute inset-0 w-full h-full object-contain drop-shadow transition-transform group-hover:scale-105"
                          alt={t.partName}
                        />
                      ))}
                    </div>

                    {/* 메타데이터 라벨 */}
                    <div className="p-3 flex flex-col gap-1">
                      <h3 className="font-bold text-sm truncate" title={item.collectionName}>
                        {item.collectionName}
                      </h3>
                      <span
                        className="text-[10px] text-zinc-500 font-mono truncate"
                        title={item.hash}
                      >
                        #{item.hash.substring(0, 12)}...
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-1">{item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. 모달 (방금 뽑은 결과 알럿) - 화면 중앙 오버레이 */}
          {newCoin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 text-center border-b flex flex-col items-center">
                  <CheckCircle2 size={48} className="text-green-500 mb-4" />
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-1">
                    코인 획득 성공!
                  </h3>
                  <p className="text-sm text-zinc-500">지갑에 새로운 코인이 들어왔습니다.</p>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center">
                  <div
                    className="relative w-48 h-48 bg-white dark:bg-zinc-950 rounded-xl shadow-inner border mb-4"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 8px 8px',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {newCoin.traits.map((t, i) => (
                      <img
                        key={i}
                        src={t.imageUrl}
                        style={{ zIndex: t.zIndex }}
                        className="absolute inset-0 w-full h-full object-contain drop-shadow-md"
                        alt=""
                      />
                    ))}
                  </div>
                  <div className="w-full text-left space-y-1">
                    <div className="text-xs font-bold text-zinc-500">SHA256 해시:</div>
                    <div className="text-[10px] bg-white dark:bg-zinc-900 p-2 rounded border font-mono text-zinc-600 dark:text-zinc-400 break-all">
                      {newCoin.hash}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirmNewCoin}
                  className="w-full p-4 font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  확인 (보관소에 넣기)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
