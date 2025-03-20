import 'dotenv/config'
import axios from "axios";
import { createClient } from '@supabase/supabase-js'
import https from 'https';
import http from 'http';

const { SUPABASE_URL, SUPABASE_KEY, KOREAEXIM_API_KEY } = process.env

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const run = async (date) => {
  try {
    /**
     * {
      result: 1,
      cur_unit: 'USD',
      ttb: '1,437.77',
      tts: '1,466.82',
      deal_bas_r: '1,452.3',
      bkpr: '1,452',
      yy_efee_r: '0',
      ten_dd_efee_r: '0',
      kftc_bkpr: '1,452',
      kftc_deal_bas_r: '1,452.3',
      cur_nm: '미국 달러'
    }
     */

    console.log(`[${date}]Fetching exchange rate data...`)

    const { data: exchanges } = await axios.get('/site/program/financial/exchangeJSON', {
      baseURL: 'https://www.koreaexim.go.kr',
      params: {
        authkey: KOREAEXIM_API_KEY,
        searchdate: date,
        data: 'AP01'
      },
    })

    const { data, error } = await supabase.from('koreaexim_exchange')
      .upsert(exchanges.map(({
        cur_unit, ttb, tts, deal_bas_r, bkpr, yy_efee_r, ten_dd_efee_r, kftc_bkpr, kftc_deal_bas_r, cur_nm
      }) => ({
        date,
        cur_unit, ttb, tts, deal_bas_r, bkpr, yy_efee_r, ten_dd_efee_r, kftc_bkpr, kftc_deal_bas_r, cur_nm
      })), { onConflict: ['date', 'cur_unit'] })
      .select()

    if (error) {
      throw error
    }

    console.table(data)
  } catch (error) {
    console.error(error)
  }
}

const getCurrentKoreanDate = () => {
  const now = new Date();
  const koreaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  
  const year = koreaDate.getFullYear();
  const month = ("0" + (koreaDate.getMonth() + 1)).slice(-2);
  const day = ("0" + koreaDate.getDate()).slice(-2);
  
  return `${year}${month}${day}`;
}

await run(getCurrentKoreanDate())